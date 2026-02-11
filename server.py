
import os
import json
import mimetypes
import time
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# Tenta importar o conector, se falhar avisa o usuário
try:
    import mysql.connector
    from mysql.connector import Error
except ImportError:
    print("\n[ERRO FATAL] Biblioteca 'mysql-connector-python' não instalada.")
    print("Execute: pip install mysql-connector-python\n")
    exit()

# Diretório base do projeto
base_dir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__, static_folder=base_dir)
CORS(app)

# Configuração padrão do XAMPP
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',  # XAMPP por padrão vem vazio
    'database': 'dutyfinder_db',
    'connect_timeout': 5
}

def get_db_connection():
    try:
        connection = mysql.connector.connect(**db_config)
        return connection
    except Error as e:
        return None

def init_db():
    print("\n" + "="*50)
    print(" DIAGNÓSTICO DE CONEXÃO DUTYFINDER")
    print("="*50)
    print(f"[*] Tentando conectar ao MySQL em: {db_config['host']}...")
    
    try:
        # Primeiro, conecta sem banco para garantir que o serviço existe
        conn = mysql.connector.connect(
            host=db_config['host'],
            user=db_config['user'],
            password=db_config['password']
        )
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_config['database']}")
        conn.close()
        print("[OK] Serviço MySQL detectado e ativo no XAMPP.")

        # Agora conecta no banco específico
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
            print(f"[OK] Banco de dados '{db_config['database']}' pronto.")
            print("="*50 + "\n")
            return True
    except Error as e:
        print("\n[!] FALHA DE CONEXÃO COM O XAMPP:")
        if e.errno == 2003:
            print("    -> O MySQL do XAMPP parece estar DESLIGADO.")
            print("    -> Abra o XAMPP Control Panel e clique em START no MySQL.")
        elif e.errno == 1045:
            print("    -> Usuário ou Senha do MySQL incorretos.")
        else:
            print(f"    -> Erro: {e}")
        print("\n[AVISO] O servidor rodará em MODO LIMITADO (apenas visualização).")
        print("="*50 + "\n")
        return False

# ROTA RAIZ
@app.route('/')
def serve_index():
    return send_from_directory(base_dir, 'index.html')

# SERVIDOR DE ARQUIVOS ESTÁTICOS
@app.route('/<path:path>')
def serve_static(path):
    full_path = os.path.join(base_dir, path)
    if not os.path.exists(full_path):
        return send_from_directory(base_dir, 'index.html')
    
    ext = os.path.splitext(path)[1].lower()
    mimetype_map = {
        '.tsx': 'application/javascript',
        '.ts': 'application/javascript',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.css': 'text/css'
    }
    mimetype = mimetype_map.get(ext, mimetypes.guess_type(path)[0])
    return send_from_directory(base_dir, path, mimetype=mimetype)

# API ENDPOINTS
@app.route('/api/health', methods=['GET'])
def health():
    db_conn = get_db_connection()
    return jsonify({
        "status": "ONLINE", 
        "database": "CONNECTED" if db_conn else "DISCONNECTED",
        "info": "XAMPP/MySQL Ativo" if db_conn else "XAMPP/MySQL Desligado"
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
    if not conn: 
        return jsonify({"error": "Banco de dados não conectado. Verifique o XAMPP."}), 503
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
    print(f"[*] ACESSE O SISTEMA: http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=False)
