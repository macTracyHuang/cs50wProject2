from flask import Flask, render_template, url_for, request, jsonify, redirect,\
    session, flash
from flask_socketio import SocketIO, emit
import datetime
import secrets
from functools import wraps

app = Flask(__name__)

# Initilize socketio
app.config["SECRET_KEY"] = secrets.token_urlsafe(16)
socketio = SocketIO(app)


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("id") is None:
            return redirect("/login")
        return f(*args, **kwargs)
    return decorated_function


@app.route("/")
@login_required
def index():
    return render_template("index.html")


# store data
first_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
channels_data = ["Flack"]
messages = {"Flack":
            [{"username": "Admin",
             "msg": "Welcome to Flask",
              "time_date": first_time}]
            }


@app.route("/channels", methods=["GET", "POST"])
@login_required
def channels():
    if request.method == "GET":
        return redirect(url_for('index'))
    elif request.method == "POST":
        username = request.form.get('username')
        ch = request.form.get('cur_ch')
        return render_template(
                'channels.html',
                channels=channels_data,
                messages=messages[ch],
                username=username)


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
            return jsonify({"success": True, 'msgs': msgs})


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
        messages[chName] = [
            {"username": "Admin", "msg": chName+" Created", "time_date": time}
            ]
        emit("new channel", chName, broadcast=True)


@socketio.on("send msg")
def msg_send(data):
    ch = data['cur_ch']
    username = data['username']
    msg = data['msg']
    time_date = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    newmsg = {'username': username, 'msg': msg, 'time_date': time_date}
    messages[ch].append(newmsg)
    emit("new msg", {'ch': ch, 'newmsg': newmsg}, broadcast=True)
    # can save only 100 messages per channel
    if len(messages[ch]) >= 100:
        messages[ch] = messages[ch][0:1]


if __name__ == '__main__':
    socketio.run(app)
