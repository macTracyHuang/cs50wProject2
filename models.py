from flask_sqlalchemy import SQLAlchemy
from setup import app

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String, nullable=False)
    score = db.Column(db.Numeric(3, 0), nullable=False)

# Link the Flask app with the database (
# no Flask app is actually being run yet).


db.init_app(app)
