from setup import app, session
from models import db


def main():
    print(db)
    # Create tables based on each table definition in `models`
    db.drop_all()
    db.create_all()
    session.app.session_interface.db.create_all()


if __name__ == "__main__":
    # Allows for command line interaction with Flask application
    with app.app_context():
        main()
