
import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error

app = Flask(__name__)
CORS(app)

# Configuração padrão (Pode ser alterada via Admin no Frontend)
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'dutyfinder_db'
}

def get_db_connection():
    try:
        connection = mysql.connector.connect(**db_config)
        return connection
    except Error as e:
        print(f"Erro ao conectar ao MySQL: {e}")
        return None

def init_db():
    conn = mysql.connector.connect(
        host=db_config['host'],
        user=db_config['user'],
        password=db_config['password']
    )
    cursor = conn.cursor()
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_config['database']}")
    conn.close()

    conn = get_db_connection()
    if conn:
        cursor = conn.cursor()
        # Tabela genérica para armazenar o estado JSON das entidades (Simplificação para integração rápida)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS system_data (
                id VARCHAR(50) PRIMARY KEY,
                content LONGTEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        conn.close()

@app.route('/api/config', methods=['POST'])
def update_config():
    global db_config
    new_config = request.json
    # Atualiza as configurações em tempo de execução
    db_config.update({
        'host': new_config.get('host', db_config['host']),
        'user': new_config.get('user', db_config['user']),
        'password': new_config.get('password', db_config['password']),
        'database': new_config.get('database', db_config['database'])
    })
    try:
        init_db()
        return jsonify({"status": "CONNECTED", "message": "Conectado ao MySQL com sucesso"})
    except Exception as e:
        return jsonify({"status": "ERROR", "message": str(e)}), 400

@app.route('/api/save/<entity>', methods=['POST'])
def save_entity(entity):
    data = request.json
    conn = get_db_connection()
    if not conn: return jsonify({"error": "No DB connection"}), 500
    
    cursor = conn.cursor()
    query = "INSERT INTO system_data (id, content) VALUES (%s, %s) ON DUPLICATE KEY UPDATE content = %s"
    content_json = json.dumps(data)
    cursor.execute(query, (entity, content_json, content_json))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

@app.route('/api/load/<entity>', methods=['GET'])
def load_entity(entity):
    conn = get_db_connection()
    if not conn: return jsonify({"error": "No DB connection"}), 500
    
    cursor = conn.cursor()
    cursor.execute("SELECT content FROM system_data WHERE id = %s", (entity,))
    result = cursor.fetchone()
    conn.close()
    
    if result:
        return jsonify(json.loads(result[0]))
    return jsonify([])

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ONLINE", "database": db_config['host']})

if __name__ == '__main__':
    try:
        init_db()
        print("Servidor rodando em http://0.0.0.0:5000")
        app.run(host='0.0.0.0', port=5000, debug=True)
    except Exception as e:
        print(f"Falha ao iniciar: {e}")
