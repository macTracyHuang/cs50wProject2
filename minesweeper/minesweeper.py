from flask import Blueprint, render_template, \
    session, redirect, url_for, request, jsonify, flash
from flask_socketio import emit
from setup import socketio
import logging

bp = Blueprint('minesweeper', __name__, static_folder='static',
               template_folder='templates')

users = set([])
@bp.route('/')
def index():
    """Return the client application."""
    username = session.get('username')
    # isIncludes = {username}.issubset(users)
    if username is None:
        if username is None:
            flash('Start Flack!')
        else:
            flash(username + ' is Playing')
        return redirect(url_for('index'))
    else:
        return render_template('game.html', username=username)


@bp.route("/users")
def getusers():
    if request.method == 'GET':
        logging.debug(users)
        return jsonify({'success': True, 'users': list(users)})


# Socket
@socketio.on('connect', namespace='/game')
def test_connect():
    logging.info(session['username'] + ' Connected to Game')
    users.add(session['username'])
    if len(users) != 0:
        emit('update client', {'users': list(users)}, broadcast=True)


@socketio.on('disconnect', namespace='/game')
def test_disconnect():
    logging.info(session['username'] + ' Disconnected from Game')
    users.remove(session['username'])
    if len(users) != 0:
        emit(
            'update client',
            {'users': list(users)}, broadcast=True, include_self=False)


@socketio.on("open cell", namespace='/game')
def cellChange(data):
    username = session.get('username')
    # if data["username"] != username:
    cell = data['cell']
    emit(
        "new open",
        {'username': username, 'cell': cell},
        broadcast=True, include_self=False
        )


@socketio.on("flag cell", namespace='/game')
def flag(data):
    cell = data['cell']
    emit(
        "new flag",
        {'username': session.get('username'), 'cell': cell},
        broadcast=True, include_self=False
        )


@socketio.on("restart game", namespace='/game')
def regame(data):
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


@socketio.on("cancel sync", namespace='/game')
def cancelsync(data):
    emit(
        "update sync",
        {'username': session.get('username'), 'sync': False},
        broadcast=True, include_self=False
        )


class Game:
    def __init__(self, fromUser, toUser):
        self.fromUser = fromUser
        self.toUser = toUser
        logging.info('new game object' + fromUser + toUser)

    def invite(self):
        logging.debug(self.fromUser + ' invite ' + self.toUser)
        emit(
            "new game",
            {'toUser': self.toUser, 'fromUser': self.fromUser},
            broadcast=True, include_self=False)

    def reject(self):
        logging.debug(self.fromUser + ' reject ' + self.toUser)
        emit(
            "no game",
            {'toUser': self.fromUser, 'fromUser': self.toUser},
            broadcast=True, include_self=False
            )

    def accept(self):
        logging.debug(self.fromUser + ' accept ' + self.toUser)
        emit(
            "yes game",
            {'toUser': self.fromUser, 'fromUser': self.toUser},
            broadcast=True, include_self=False)


@socketio.on("invite game", namespace='/game')
def new_game(data):
    logging.debug('new game invitation')
    fromUser = data['fromUser']
    toUser = data['toUser']
    newgame = Game(fromUser, toUser)
    newgame.invite()

    @socketio.on("reject game", namespace='/game')
    def reject_game(data):
        newgame.reject()

    @socketio.on("accept game", namespace='/game')
    def accept_game(data):
        board = data['board']
        # sync
        emit(
            "update sync",
            {'username': session.get('username'), 'sync': True},
            broadcast=True, include_self=False
            )
        updateboard(board)
        newgame.accept()
