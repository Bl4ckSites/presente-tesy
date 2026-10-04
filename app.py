import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import requests

app = Flask(__name__)

# CORS – permite qualquer origem? Não, vamos especificar a sua.
CORS(app, origins=["https://fadinha.xyz"])

# Chave secreta do Turnstile (vem do ambiente)
TURNSTILE_SECRET = os.getenv("TURNSTILE_SECRET")
# URL de destino (Telegram)
REDIRECT_URL = os.getenv("REDIRECT_URL", "https://t.me/seu_canal")

if not TURNSTILE_SECRET:
    raise RuntimeError("Variável TURNSTILE_SECRET não definida.")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Rate limiting (opcional)
limiter = Limiter(app=app, key_func=get_remote_address, default_limits=["10 per minute"])

@app.route('/get-redirect', methods=['POST'])
@limiter.limit("10 per minute")
def get_redirect():
    client_ip = get_remote_address()
    logger.info(f"Requisição de IP: {client_ip}")

    data = request.get_json(silent=True)
    if not data or 'token' not in data:
        logger.warning(f"Dados inválidos de {client_ip}")
        return jsonify({"success": False, "error": "Token ausente"}), 400

    token = data['token']

    try:
        resp = requests.post('https://challenges.cloudflare.com/turnstile/v0/siteverify', data={
            'secret': TURNSTILE_SECRET,
            'response': token,
            'remoteip': client_ip
        }, timeout=5)
        result = resp.json()
        logger.info(f"Resultado Turnstile: {result}")

        if result.get('success'):
            logger.info(f"Redirecionamento autorizado para {client_ip}")
            return jsonify({"success": True, "redirect_url": REDIRECT_URL})
        else:
            logger.warning(f"Falha Turnstile: {result.get('error-codes')}")
            return jsonify({"success": False, "error": "Verificação de segurança falhou"}), 403
    except requests.exceptions.RequestException as e:
        logger.error(f"Erro ao verificar Turnstile: {e}")
        return jsonify({"success": False, "error": "Erro interno"}), 500

@app.route('/health')
def health():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
