from flask import Blueprint, render_template, session
from flask_socketio import emit
from setup import socketio

bp = Blueprint('minesweeper', __name__, static_folder='static',
               template_folder='templates')


@bp.route('/')
def index():
    """Return the client application."""
    username = session.get('username')
    session['username'] = username
    return render_template('game.html', username=username)

# Socket
@socketio.on("open cell")
def cellChange(data):
    username = session.get('username')
    # if data["username"] != username:
    cell = data['cell']
    emit(
        "new open",
        {'username': username, 'cell': cell},
        broadcast=True, include_self=False
        )


@socketio.on("flag cell")
def flag(data):
    cell = data['cell']
    emit(
        "new flag",
        {'username': session.get('username'), 'cell': cell},
        broadcast=True, include_self=False
        )


@socketio.on("invite")
def invite(data):
    board = data['board']
    # sync
    emit(
        "update sync",
        {'username': session.get('username'), 'sync': True},
        broadcast=True, include_self=False
        )
    updateboard(board)


def updateboard(board):
    # updateboard
    emit(
        "update board",
        {'username': session.get('username'), 'board': board},
        broadcast=True, include_self=False
        )


@socketio.on("cancel sync")
def cancelsync(data):
    emit(
        "update sync",
        {'username': session.get('username'), 'sync': False},
        broadcast=True, include_self=False
        )
