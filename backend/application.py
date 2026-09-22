"""
AWS Elastic Beanstalk entrypoint.
Elastic Beanstalk expects a file named application.py with a callable named application.
"""
from main import app

application = app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("application:application", host="0.0.0.0", port=5000)
