# db_connection.py
import pymongo

# MongoDB connection string and database name
url = 'mongodb://localhost:27017/'
client = pymongo.MongoClient(url)

# Replace 'Smart-Education-System' with your actual database name
db = client['Smart-Education']

# Define your single users collection
user_collection = db['users']