from flask import Flask
from flask_socketio import SocketIO
import secrets
from minesweeper import bp as game_bp

app = Flask(__name__)

# Initilize socketio
app.config["SECRET_KEY"] = secrets.token_urlsafe(16)
socketio = SocketIO(app)
app.register_blueprint(game_bp, url_prefix='/game')
