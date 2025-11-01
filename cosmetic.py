from app import version

@app.route('/api/version')
def get_version():
    return version