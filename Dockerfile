FROM python:3
ADD . /usr/src/app
WORKDIR /usr/src/app
RUN pip install -r requirements.txt
CMD python application.py
