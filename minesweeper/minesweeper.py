from flask import Blueprint, render_template, \
    session, redirect, url_for, request, jsonify, flash
from flask_socketio import emit, join_room, leave_room
from setup import socketio
import logging
import random
import string

bp = Blueprint('minesweeper', __name__, static_folder='static',
               template_folder='templates')

users = {}
bestScore = 198
bestUser = "Apple"
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
        return render_template(
            'game.html',
            username=username, bestScore=bestScore, bestUser=bestUser)


@bp.route("/users")
def getusers():
    if request.method == 'GET':
        logging.debug(users)
        return jsonify({'success': True, 'users': list(users.keys())})


# Socket
@socketio.on('connect', namespace='/game')
def test_connect():
    logging.info(session['username'] + ' Connected to Game')
    join_room(request.sid)
    users[session['username']] = request.sid
    if len(users) != 0:
        emit('update client', {'users': list(users.keys())}, broadcast=True)


@socketio.on('disconnect', namespace='/game')
def test_disconnect():
    logging.info(session['username'] + ' Disconnected from Game')
    leave_room(request.sid)
    try:
        users.pop(session['username'])
    except KeyError:
        logging.warning('no key:' + session['username'])
    if len(users) != 0:
        emit(
            'update client',
            {'users': list(users.keys())}, broadcast=True, include_self=False)


class Game:
    def __init__(self, fromUser, toUser):
        self.fromUser = fromUser
        self.toUser = toUser
        self.room = getRandomRoom()
        self.fromSid = users.get(fromUser)
        self.toSid = users.get(toUser)
        logging.info('new game object ' + fromUser + toUser)

    def invite(self):
        join_room(self.room, self.fromSid)
        join_room(self.room, self.toSid)
        logging.debug(self.fromUser + ' invite ' + self.toUser)
        emit(
            "new game",
            {'toUser': self.toUser, 'fromUser': self.fromUser},
            broadcast=True, include_self=False, room=self.room)
        emit(
            'update roomid',
            {'fromUser': self.fromUser, 'toUser': self.toUser,
                'roomid': self.room}, broadcast=True, room=self.room)
        logging.debug(self.fromUser + ' emit ud room: ' + self.toUser)

    def reject(self):
        logging.debug(self.fromUser + ' reject ' + self.toUser)
        emit(
            "no game",
            {'toUser': self.fromUser, 'fromUser': self.toUser},
            broadcast=True, include_self=False, room=self.room
            )
        emit(
            'update roomid',
            {'fromUser': self.fromUser, 'toUser': self.toUser, 'roomid': 'df'},
            broadcast=True, room=self.room)
        leave_room(self.room, self.fromSid)
        leave_room(self.room, self.toSid)

    def accept(self):
        logging.debug(self.fromUser + ' accept ' + self.toUser)
        emit(
            "yes game",
            {'toUser': self.fromUser, 'fromUser': self.toUser},
            broadcast=True, include_self=False, room=self.room)

    def open(self, data):
        username = session.get('username')
        # if data["username"] != username:
        cell = data['cell']
        emit(
            "new open",
            {'username': username, 'cell': cell},
            broadcast=True, include_self=False, room=self.room
            )

    def flag(self, data):
        cell = data['cell']
        emit(
            "new flag",
            {'username': session.get('username'), 'cell': cell},
            broadcast=True, include_self=False, room=self.room
            )

    def restart(self, data):
        board = data['board']
        self.updateboard(board)

    def cancelsync(self, data):
        emit(
            'update roomid',
            {'fromUser': self.fromUser, 'toUser': self.toUser, 'roomid': 'df'},
            broadcast=True, room=self.room)
        logging.info('emit ud room')
        emit(
            "update sync",
            {'username': session.get('username'), 'sync': False},
            broadcast=True, room=self.room
            )
        logging.info('emit ud sync')
        leave_room(self.room, self.fromSid)
        leave_room(self.room, self.toSid)

    def updateboard(self, board):
        # updateboard
        emit(
            "update board",
            {'username': session.get('username'), 'board': board},
            broadcast=True, include_self=False, room=self.room
            )


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
            {'username': session.get('username'),
                'sync': True},
            broadcast=True, include_self=False, room=newgame.room
            )
        newgame.updateboard(board)
        newgame.accept()

    @socketio.on("open cell", namespace='/game')
    def open(data):
        newgame.open(data)

    @socketio.on("flag cell", namespace='/game')
    def flag(data):
        newgame.flag(data)

    @socketio.on("restart game", namespace='/game')
    def regame(data):
        newgame.restart(data)

    @socketio.on("cancel sync", namespace='/game')
    def cancel(data):
        logging.info('cancel sync receive')
        newgame.cancelsync(data)


def getRandomRoom():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
