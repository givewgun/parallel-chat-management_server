runserver :
- install nginx
- apply nginx.conf in ./loadbalancer/nginx.conf
- cmd/terminal -> npm install
- install MySQL
- create MySQL database by running /database_file/db_gen.sql 
- change password to your MySQL password in /config/dbconnect.js
- cmd/terminal -> npm run server
- cmd/terminal -> pytest -v test_chatmgmt_server.py
