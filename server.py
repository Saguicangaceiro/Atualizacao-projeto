
import os
import json
import mimetypes
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error

# Garante que o Windows reconheça arquivos TS e TSX como Javascript
mimetypes.add_type('application/javascript', '.ts')
mimetypes.add_type('application/javascript', '.tsx')

base_dir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__, static_folder=base_dir)
CORS(app)

# Configuração do Banco de Dados
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
    except Error:
        return None

def init_db():
    print(f"[*] Verificando MySQL em {db_config['host']}...")
    try:
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
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS system_data (
                    id VARCHAR(50) PRIMARY KEY,
                    content LONGTEXT NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            """)
            conn.commit()
            conn.close()
            print(f"[OK] Banco de dados '{db_config['database']}' está ativo.")
            return True
    except Exception as e:
        print(f"[AVISO] Servidor MySQL (XAMPP) não detectado. O sistema usará armazenamento local temporário. Erro: {e}")
        return False

@app.route('/')
def serve_index():
    return send_from_directory(base_dir, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    # Se o arquivo não existir, tenta servir o index (útil para rotas SPA)
    if not os.path.exists(os.path.join(base_dir, path)):
        return send_from_directory(base_dir, 'index.html')
    return send_from_directory(base_dir, path)

# API
@app.route('/api/health', methods=['GET'])
def health():
    db_conn = get_db_connection()
    return jsonify({
        "status": "ONLINE", 
        "database": "CONNECTED" if db_conn else "DISCONNECTED"
    })

@app.route('/api/load/<entity>', methods=['GET'])
def load_entity(entity):
    conn = get_db_connection()
    if not conn: return jsonify([])
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT content FROM system_data WHERE id = %s", (entity,))
        result = cursor.fetchone()
        conn.close()
        return jsonify(json.loads(result[0])) if result else jsonify([])
    except:
        return jsonify([])

@app.route('/api/save/<entity>', methods=['POST'])
def save_entity(entity):
    data = request.json
    conn = get_db_connection()
    if not conn: return jsonify({"error": "No DB"}), 500
    try:
        cursor = conn.cursor()
        content_json = json.dumps(data)
        query = "INSERT INTO system_data (id, content) VALUES (%s, %s) ON DUPLICATE KEY UPDATE content = %s"
        cursor.execute(query, (entity, content_json, content_json))
        conn.commit()
        conn.close()
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    init_db()
    print("\n" + "="*50)
    print(" SERVIDOR DUTYFINDER ONLINE")
    print(" ACESSE: http://localhost:5000")
    print("="*50 + "\n")
    app.run(host='0.0.0.0', port=5000, debug=False)
