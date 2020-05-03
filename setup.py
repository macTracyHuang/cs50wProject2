from flask import Flask
import secrets
from flask_socketio import SocketIO


app = Flask(__name__)
socketio = SocketIO(app)
# Initilize socketio
app.config["SECRET_KEY"] = secrets.token_urlsafe(16)
