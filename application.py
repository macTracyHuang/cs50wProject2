from flask import render_template, url_for, request,\
    jsonify, redirect, session, flash
from flask_socketio import emit
import datetime
from functools import wraps
from minesweeper import bp as game_bp
from setup import app, socketio
import logging


FORMAT = '%(asctime)s %(levelname)s: %(message)s'
logging.basicConfig(
    level=logging.DEBUG, filename='myLog.log', filemode='w', format=FORMAT)


app.register_blueprint(game_bp, url_prefix='/game')


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("id") is None:
            return redirect("/login")
        return f(*args, **kwargs)
    return decorated_function


@app.route("/")
# @login_required
def index():
    return render_template("index.html")


# store data
first_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
channels_data = ["Flack"]
messages = {"Flack": [
    {"username": "Admin", "msg": "Welcome to Flack", "time_date": first_time,
        'pmto': "undefined"}
    ]}


@app.route("/channels", methods=["GET", "POST"])
# @login_required
def channels():
    if request.method == "GET":
        return redirect(url_for('index'))
    elif request.method == "POST":
        username = request.form.get('username')
        session['username'] = username
        ch = request.form.get('cur_ch')
        return render_template(
            'channels.html', channels=channels_data,
            messages=messages[ch], username=username)


@app.route("/loadmsg", methods=["GET", "POST"])
def loadmsg():
    if request.method == "GET":
        return jsonify('oops')
    if request.method == "POST":
        ch = request.form.get('ch')
        if ch not in channels_data:
            socketio.emit("error", 'no such channel', broadcast=False)
            return jsonify({"success": False})
        else:
            msgs = messages[ch]
            return jsonify(
                {"success": True, 'msgs': msgs})


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        if session.get("id") is None:
            flash('Please log in')
            return render_template("login.html")
        else:
            flash('Already Logged In')
            return render_template("index.html")

    elif request.method == "POST":
        # Get form information
        password = request.form.get("password")
        # check input is valid
        if password != "1210":
            flash("Invalid password")
            return render_template("login.html")
        session['id'] = "admin"
        return render_template("index.html")

# Socket
@socketio.on("create channel")
def createCh(data):
    chName = data["chName"]
    if chName in channels_data:
        error = "Dupliate channel name"
        emit("error", error, broadcast=False)
    else:
        channels_data.append(chName)
        time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        messages[chName] = [{
            "username": "Admin", "msg": chName+" Created", "time_date": time
            }]
        emit("new channel", chName, broadcast=True)


@socketio.on("send msg")
def msg_send(data):
    ch = data['cur_ch']
    username = data['username']
    msg = data['msg']
    logging.debug(data)
    pmto = data['pmto']
    time_date = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    newmsg = {
        'username': username, 'msg': msg, 'time_date': time_date, 'pmto': pmto}
    messages[ch].append(newmsg)
    emit("new msg", {'ch': ch, 'newmsg': newmsg}, broadcast=True)
    # can save only 100 messages per channel
    if len(messages[ch]) >= 100:
        messages[ch] = messages[ch][0:1]


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
        emit(
            "no game",
            {'toUser': self.fromUser, 'fromUser': self.toUser},
            broadcast=True, include_self=False
            )

    def accept(self):
        emit(
            "yes game",
            {'toUser': self.fromUser, 'fromUser': self.toUser},
            broadcast=True)


@socketio.on("invite game")
def new_game(data):
    logging.debug('new game invitation')
    fromUser = data['fromUser']
    toUser = data['toUser']
    newgame = Game(fromUser, toUser)
    newgame.invite()

    @socketio.on("reject game")
    def reject_game(data):
        newgame.reject()

    @socketio.on("accept game")
    def accept_game(data):
        newgame.accept()


if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0", debug=True)
