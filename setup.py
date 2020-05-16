from flask import Flask
import secrets
from flask_socketio import SocketIO
from flask_session import Session
import os


app = Flask(__name__)
socketio = SocketIO(app)
# Initilize socketio
app.config["SECRET_KEY"] = secrets.token_urlsafe(16)

# Tell Flask what SQLAlchemy databas to use.
# app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_DATABASE_URI"] = "postgres://lavryymoqltgmo:1c8c4b805c108437893d706cd3236b20b827152b6625d2b98500fb606c870de3@ec2-52-201-55-4.compute-1.amazonaws.com:5432/d89j9hhccicq8l" # noqa
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Session configuration
app.config["SESSION_PERMANENT"] = True
app.config["SESSION_TYPE"] = "sqlalchemy"

session = Session(app)
