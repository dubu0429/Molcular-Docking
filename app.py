import os
import json
from flask import Flask, render_template, request, jsonify

# Flask 앱을 초기화합니다.
app = Flask(__name__)

# [에러 방지] 개발 중 코드가 바뀔 때마다 서버가 자동으로 새로고침되도록 설정합니다.
app.config['DEBUG'] = True

@app.route('/')
def index():
    """
    사용자가 웹사이트(http://127.0.0.1:5000/)에 처음 접속했을 때
    templates/index.html 파일을 화면에 띄워주는 라우터 함수입니다.
    """
    return render_template('index.html')


@app.route('/api/simulate', methods=['GET'])
def simulate():
    """
    프론트엔드(main.js)에서 'api/simulate?drug=약물이름' 주소로 
    데이터를 요청하면 작동하는 API 라우터 함수입니다.
    """
    # 1. URL 요청 파라미터에서 사용자가 선택한 약물 이름을 가져옵니다.
    #    예: /api/simulate?drug=remdesivir -> 'remdesivir' 추출
    selected_drug = request.args.get('drug')
    
    if not selected_drug:
        return jsonify({"error": "선택된 약물이 없습니다."}), 400

    # 2. static/data/drugs.json 파일의 정확한 경로를 설정합니다.
    #    (경로 꼬임 방지를 위해 os.path를 사용하여 절대 경로 형태로 지정)
    base_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(base_dir, 'static', 'data', 'drugs.json')

    try:
        # 3. JSON 데이터 파일을 읽어옵니다.
        with open(json_path, 'r', encoding='utf-8') as f:
            drugs_data = json.load(f)
        
        # 4. 읽어온 데이터 중에서 사용자가 요청한 약물이 있는지 확인합니다.
        if selected_drug in drugs_data:
            # 매칭되는 약물 데이터를 자바스크립트가 읽을 수 있게 JSON 형태로 반환합니다.
            return jsonify(drugs_data[selected_drug])
        else:
            return jsonify({"error": "해당 약물의 데이터가 존재하지 않습니다."}), 404

    except FileNotFoundError:
        return jsonify({"error": "drugs.json 파일을 찾을 수 없습니다. 경로를 확인하세요."}), 500
    except json.JSONDecodeError:
        return jsonify({"error": "JSON 파일 서식이 올바르지 않습니다."}), 500


# 이 파일이 터미널에서 직접 실행될 때만 Flask 서버를 구동합니다.
if __name__ == '__main__':
    # host='127.0.0.1', port=5000 시스템 기본 주소로 서버를 엽니다.
    app.run(host='127.0.0.1', port=5000)