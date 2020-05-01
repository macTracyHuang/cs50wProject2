from flask import Blueprint, render_template
# , current_app, session, url_for,
# from flask_socketio import emit

bp = Blueprint('minesweeper', __name__, static_folder='static',
               template_folder='templates')


@bp.route('/')
def index():
    """Return the client application."""
    return render_template('game.html')
