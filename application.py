from flask import Flask,render_template,url_for,request,jsonify
from flask_socketio import SocketIO, emit
import datetime, time
import secrets

app=Flask(__name__)

#Initilize socketio
app.config["SECRET_KEY"]=secrets.token_urlsafe(16)
socketio = SocketIO(app)

@app.route("/")
def index():
    return render_template("index.html")

# store data
first_time=datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
channels_data=["Flack"]
messages={"Flack":[{"username":"Admin","msg":"Welcome to Flask","time_date":first_time}]}

@app.route("/channels",methods=["GET","POST"])
def channels():
    if request.method=="GET":
        return render_template('channels.html',channels=channels_data,messages=messages["Flack"])
    elif request.method=="POST":
        username=request.form.get('username')
        ch=request.form.get('cur_ch')
        return render_template('channels.html',channels=channels_data,messages=messages[ch],username=username)

@socketio.on("create channel")
def createCh(data):
  chName = data["chName"]
  if chName in channels_data:
      error="Dupliate channel name"
      emit("error",error,broadcast=False)
  else:
      channels_data.append(chName)
      messages[chName]=[]
      emit("new channel", chName, broadcast=True)

@socketio.on("send msg")
def msg_send(data):
    ch=data['cur_ch']
    username=data['username']
    msg=data['msg']
    time_date=datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    newmsg={'username':username,'msg':msg,'time_date':time_date}
    messages[ch].append(newmsg)
    emit("new msg",{'ch':ch,'newmsg':newmsg},broadcast=True)

if __name__ == '__main__':
    socketio.run(app)
