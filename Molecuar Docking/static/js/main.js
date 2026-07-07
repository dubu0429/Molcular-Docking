// 전역 변수로 3D 뷰어 객체를 선언합니다.
let viewer = null;

// 웹 페이지가 완전히 로드되면 실행되는 기본 함수입니다.
document.addEventListener("DOMContentLoaded", function() {
    // 1. 단백질 3D 뷰어 초기화 및 6LU7.pdb 파일 로드
    initProteinViewer();

    // 2. 버튼 클릭 이벤트 리스너 등록
    const simulateBtn = document.getElementById("btn-simulate");
    simulateBtn.addEventListener("click", runSimulation);
});

/**
 * 3Dmol.js를 사용해 화면에 코로나19 단백질을 띄우는 함수
 */
function initProteinViewer() {
    const element = document.getElementById("protein-viewer");
    
    // 뷰어 설정 (마우스 제어 활성화 및 배경색 설정)
    viewer = $3Dmol.createViewer(element, { backgroundColor: '#fcfcfc' });

    // Flask의 static 폴더에 넣어둔 6LU7.pdb 파일을 비동기적으로 읽어옵니다.
    fetch('/static/data/6LU7.pdb')
        .then(response => {
            if (!response.ok) {
                throw new Error("PDB 파일을 찾을 수 없습니다. 경로를 확인해주세요.");
            }
            return response.text();
        })
        .then(pdbData => {
            // 읽어온 PDB 데이터를 뷰어에 주입합니다.
            viewer.addModel(pdbData, "pdb");
            
            // 단백질을 멋진 리본(Ribbon) 형태로 스타일링하고 체인별로 색상을 줍니다.
            viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
            
            // 화면 중앙에 단백질을 맞추고 카메라를 정렬합니다.
            viewer.zoomTo();
            viewer.render();
        })
        .catch(error => {
            console.error("단백질 시각화 실패:", error);
            element.innerHTML = "<p style='color:red; padding:20px;'>단백질 구조 파일을 로드하는 데 실패했습니다.</p>";
        });
}

/**
 * 사용자가 선택한 약물 데이터를 백엔드에 요청하고 화면에 표시하는 함수
 */
function runSimulation() {
    const drugSelect = document.getElementById("drug-select");
    const selectedDrug = drugSelect.value;

    // 사용자가 약물을 선택하지 않고 버튼을 눌렀을 때 예외 처리
    if (!selectedDrug) {
        alert("결합할 약물을 선택해주세요!");
        return;
    }

    // [중요] Flask 백엔드 서버의 '/api/simulate' 주소로 약물 이름을 보내 데이터를 요청합니다.
    fetch(`/api/simulate?drug=${selectedDrug}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("백엔드 서버로부터 데이터를 가져오지 못했습니다.");
            }
            return response.json();
        })
        .then(data => {
            // 백엔드에서 성공적으로 데이터를 가져오면 화면을 업데이트합니다.
            displayResults(data);
        })
        .catch(error => {
            console.error("시뮬레이션 에러:", error);
            alert("시뮬레이션 수행 중 오류가 발생했습니다. 백엔드 연결을 확인하세요.");
        });
}

/**
 * 받아온 데이터를 바탕으로 UI 결과창을 업데이트하는 함수
 */
function displayResults(drugData) {
    // 1. 최초 가이드 메시지("결합할 약물을 선택해주세요~")를 숨깁니다.
    document.getElementById("guide-message").style.display = "none";
    
    // 2. 실제 결과 레이아웃을 보이게 합니다.
    const resultContent = document.getElementById("result-content");
    resultContent.style.display = "block";

    // 3. JSON에서 받아온 텍스트 데이터를 각 HTML 요소에 주입합니다.
    document.getElementById("res-name").innerText = drugData.name;
    document.getElementById("res-type").innerText = drugData.type;
    document.getElementById("res-energy").innerText = drugData.energy.toFixed(4) + " kcal/mol";
    document.getElementById("res-evaluation").innerText = drugData.evaluation;
    document.getElementById("res-tip").innerText = drugData.tip;

    // 4. 추가 계획 반영: '약물 분자 구조 크게 보기' 버튼 표시 처리
    // 4. 추가 계획 반영: '약물 분자 구조 크게 보기' 버튼 처리
    const viewDrugBtn = document.getElementById("btn-view-drug");
    if (drugData.file_name) {
        viewDrugBtn.style.display = "inline-block";
        
        // [수정됨] 클릭 시 팝업창을 띄워 약물 구조를 보여주는 함수 실행
        viewDrugBtn.onclick = function() {
            showDrug3D(drugData.file_name);
        };
    } else {
        viewDrugBtn.style.display = "none";
    }
} // <-- 기존 displayResults 함수의 닫는 괄호

/**
 * [신규 추가] 약물 SDF 파일을 불러와 팝업(Modal)으로 띄워주는 함수
 */
function showDrug3D(fileName) {
    // 1. 화면 전체를 덮는 어두운 배경(Overlay) 만들기
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0'; 
    modal.style.left = '0';
    modal.style.width = '100vw'; 
    modal.style.height = '100vh';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'; // 반투명 검은색
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '9999';

    // 2. 3D 뷰어가 들어갈 하얀색 박스 만들기
    const viewerBox = document.createElement('div');
    viewerBox.style.width = '600px';
    viewerBox.style.height = '600px';
    viewerBox.style.backgroundColor = '#ffffff';
    viewerBox.style.borderRadius = '16px';
    viewerBox.style.position = 'relative';
    viewerBox.style.overflow = 'hidden';
    viewerBox.style.boxShadow = '0 15px 35px rgba(0,0,0,0.2)';

    // 3. 닫기 버튼 만들기
    const closeBtn = document.createElement('button');
    closeBtn.innerText = '닫기 ✕';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '15px';
    closeBtn.style.right = '15px';
    closeBtn.style.zIndex = '10000';
    closeBtn.style.padding = '8px 15px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.backgroundColor = '#e63946'; // 빨간색 포인트
    closeBtn.style.color = '#fff';
    closeBtn.style.border = 'none';
    closeBtn.style.borderRadius = '8px';
    closeBtn.style.fontWeight = 'bold';
    
    // 닫기 버튼을 누르면 팝업창 전체를 삭제!
    closeBtn.onclick = function() {
        document.body.removeChild(modal);
    };

    // 요소들을 조립해서 화면에 붙이기
    viewerBox.appendChild(closeBtn);
    modal.appendChild(viewerBox);
    document.body.appendChild(modal);

    // 4. 생성된 박스 안에 3Dmol 뷰어 초기화
    let drugViewer = $3Dmol.createViewer(viewerBox, { backgroundColor: '#f4f7f9' });

    // 5. 약물 SDF 파일 읽어오기
    fetch(`/static/data/${fileName}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("약물 파일을 찾을 수 없습니다.");
            }
            return response.text();
        })
        .then(sdfData => {
            drugViewer.addModel(sdfData, "sdf");
            
            // 약물은 단백질과 다르게 막대(Stick)와 구(Sphere) 형태로 렌더링해야 예쁨!
            drugViewer.setStyle({}, { stick: { radius: 0.15 }, sphere: { scale: 0.25 } });
            
            drugViewer.zoomTo();
            drugViewer.render();
        })
        .catch(error => {
            console.error(error);
            alert(`에러: ${fileName} 파일을 불러오지 못했습니다. 파일 위치를 확인해주세요!`);
            document.body.removeChild(modal); // 에러 나면 팝업 닫기
        });
}