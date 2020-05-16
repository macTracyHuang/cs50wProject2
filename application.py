from flask import render_template, request,\
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


currentusers = set()
@app.route("/")
# @login_required
def index():
    return render_template("index.html")


@app.route("/users")
def users():
    if request.method == 'GET':
        logging.debug(currentusers)
        return jsonify({'success': True, 'users': list(currentusers)})


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
        username = session['username']
        ch = 'Flack'
        return render_template(
            'channels.html', channels=channels_data,
            messages=messages[ch], username=username)
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
@socketio.on('connect', namespace='/channels')
def channels_connect():
    logging.info(session['username'] + ' Connected to Channels')
    currentusers.add(session['username'])


@socketio.on('disconnect', namespace='/channels')
def channels_disconnect():
    logging.info(session['username'] + ' Disconnected from Channels')
    currentusers.remove(session['username'])


@socketio.on("create channel", namespace='/channels')
def createCh(data):
    chName = data["chName"]
    if chName in channels_data:
        error = "Dupliate channel name"
        emit("error", error, broadcast=False)
    else:
        channels_data.append(chName)
        time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        messages[chName] = [{
            "username": "Admin", "msg": chName+" Created", "time_date": time,
            'pmto': "undefined"
            }]
        logging.info(str(messages[chName]))
        emit("new channel", chName, broadcast=True)


@socketio.on("send msg", namespace='/channels')
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


if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0", debug=True)
