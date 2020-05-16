from flask import Blueprint, render_template, \
    session, redirect, url_for, request, jsonify, flash
from flask_socketio import emit, join_room, leave_room, rooms
from setup import socketio
import logging
import random
import string
from models import User, db

bp = Blueprint('minesweeper', __name__, static_folder='static',
               template_folder='templates')

users = {}
bestScore = 198
bestUser = "Apple"
ingame = []
games = {}
@bp.route('/')
def index():
    logging.info(str(ingame))
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
        # check if user in db
        dbuser = db.session.query(User).\
            filter_by(username=session.get('username')).first()
        if dbuser is None:
            newuser = User(username=username, score="999")
            db.session.add(newuser)
            db.session.commit()
        best = db.session.query(User).order_by(User.score.asc()).first()
        global bestScore
        global bestUser
        bestScore = best.score
        bestUser = best.username
        usersc = db.session.query(User).\
            filter_by(username=session.get('username')).first().score
        return render_template(
            'game.html',
            username=username, bestScore=bestScore, bestUser=bestUser,
            usersc=usersc)


@bp.route("/users")
def getusers():
    if request.method == 'GET':
        logging.debug(users)
        return jsonify({'success': True, 'users': list(users.keys())})


# Socket
@socketio.on('connect', namespace='/game')
def test_connect():
    """A new user connects to the game."""
    if request.args.get('username') is None:
        return False
    session['username'] = request.args['username']
    join_room(request.sid)
    users[session.get('username')] = request.sid
    if len(users) != 0:
        emit('update client', {'users': list(users.keys())}, broadcast=True)


@socketio.on('disconnect', namespace='/game')
def test_disconnect():
    logging.info(session.get('username') + ' Disconnected from Game')
    try:
        ingame.remove(session.get('username'))
    except ValueError:
        logging.warning(session.get('username') + ' not ingame')
    for r in rooms(request.sid):
        leave_room(r, request.sid)
    try:
        users.pop(session.get('username'))
        logging.info('pop: ' + session.get('username'))
    except KeyError:
        logging.warning('no key:' + session.get('username'))
    if len(users) != 0:
        emit(
            'update client',
            {'users': list(users.keys())}, broadcast=True, include_self=False)


class Game:
    def __init__(self, fromUser, toUser, roomid):
        self.fromUser = fromUser
        self.toUser = toUser
        self.room = roomid
        self.fromSid = users.get(fromUser)
        self.toSid = users.get(toUser)
        games[self.room] = self
        logging.info('new game object ' + fromUser + toUser)
        logging.debug(self.room)

    def invite(self):
        logging.info('inside invite method')
        try:
            fromRooms = rooms(self.fromSid)
            logging.info('try rooms')
        except Exception:
            logging.warning('no rooms')
        logging.info(self.fromSid + ' is in ' + str(fromRooms))
        toRooms = rooms(self.toSid)
        logging.info(self.toSid + ' is in ' + str(toRooms))
        for r in fromRooms:
            if r != self.fromSid:
                logging.debug(self.fromSid + ' leaves' + r)
                leave_room(r, self.fromSid)
        for r2 in toRooms:
            if r2 != self.toSid:
                logging.debug(self.toSid + ' leaves' + r)
                leave_room(r, self.toSid)
        join_room(self.room, self.fromSid)
        logging.debug(self.fromUser + self.fromSid + ' joins' + self.room)
        join_room(self.room, self.toSid)
        logging.debug(self.toUser + self.toSid + ' joins' + self.room)
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
        games.pop(self.room)

    def accept(self):
        logging.debug(self.fromUser + ' accept ' + self.toUser)
        ingame.append(self.fromUser)
        ingame.append(self.toUser)
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
        logging.debug('open cell in ' + self.room)

    def flag(self, data):
        cell = data['cell']
        emit(
            "new flag",
            {'username': session.get('username'), 'cell': cell},
            broadcast=True, include_self=False, room=self.room
            )
        logging.debug('flag cell in ' + self.room)

    def restart(self, data):
        board = data['board']
        self.updateboard(board)

    def cancelsync(self, data):
        logging.info(str(self.fromUser))
        logging.info(data['fromUser'] + 'cancel sync')
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
        if users.get(self.fromUser) is None and \
                users.get(self.toUser) is not None:
            msg = self.fromUser + 'is disconnected'
            ingame.remove(self.toUser)
            leave_room(self.room, self.toSid)
            emit('error', msg)
        elif users.get(self.toUser) is None and \
                users.get(self.fromUser) is not None:
            ingame.remove(self.fromUser)
            leave_room(self.room, self.fromSid)
            msg = self.toUser + 'is disconnected'
            emit('error', msg)
        else:
            ingame.remove(self.fromUser)
            ingame.remove(self.toUser)
            logging.info('ingame: ' + str(ingame))
            leave_room(self.room, self.fromSid)
            leave_room(self.room, self.toSid)
        games.pop(self.room)

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
    roomid = getRandomRoom()
    newgame = Game(fromUser, toUser, roomid)
    if users.get(fromUser) is None:
        msg = fromUser + ' is Disconnected'
        emit('error', msg)
    elif users.get(toUser) is None:
        msg = fromUser + ' is Disconnected'
        emit('error', msg)
    elif (fromUser in ingame) or (toUser in ingame):
        errormsg = 'User is playing with others'
        emit('error', errormsg)
    elif fromUser == toUser:
        errormsg = 'Cannot invite yourself'
        emit('error', errormsg)
    else:
        logging.info('try invite')
        newgame.invite()


@socketio.on("reject game", namespace='/game')
def reject_game(data):
    game = games.get(data['roomid'])
    game.reject()


@socketio.on("accept game", namespace='/game')
def accept_game(data):
    game = games.get(data['roomid'])
    board = data['board']
    # sync
    emit(
        "update sync",
        {'username': session.get('username'),
            'sync': True},
        broadcast=True, room=game.room
        )
    game.updateboard(board)
    game.accept()


@socketio.on("open cell", namespace='/game')
def open(data):
    game = games.get(data['roomid'])
    game.open(data)


@socketio.on("flag cell", namespace='/game')
def flag(data):
    game = games.get(data['roomid'])
    game.flag(data)


@socketio.on("restart game", namespace='/game')
def regame(data):
    game = games.get(data['roomid'])
    game.restart(data)


@socketio.on("cancel sync", namespace='/game')
def cancel(data):
    game = games.get(data['roomid'])
    logging.info('cancel sync receive')
    game.cancelsync(data)


@socketio.on("new score", namespace='/game')
def newscore(data):
    newscore = data['score']
    dbuser = db.session.query(User).filter_by(username=data['username'])\
        .first()
    if newscore < dbuser.score:
        dbuser.score = newscore
        db.session.commit()
    global bestScore
    global bestUser
    if newscore < bestScore:
        bestScore = newscore
        bestUser = data['username']
        emit(
            'update score', {'bestScore': bestScore, 'bestUser': bestUser},
            broadcast=True)


def getRandomRoom():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
