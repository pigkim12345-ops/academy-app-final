import { useEffect, useState } from "react"
import app from "./firebase"

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from "firebase/firestore"

const db = getFirestore(app)

function App() {
  const [name, setName] = useState("")
  const [date, setDate] = useState("")
  const [startTime, setStartTime] = useState("12:00")
  const [endTime, setEndTime] = useState("13:00")

  const [requests, setRequests] = useState([])

  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")

  const [filterDate, setFilterDate] = useState("")

  const fetchRequests = async () => {
    const snapshot = await getDocs(collection(db, "requests"))

    const data = []

    snapshot.forEach((item) => {
      data.push({
        id: item.id,
        ...item.data()
      })
    })

    setRequests(data)
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleSubmit = async () => {
    if (!name || !date) {
      alert("반/이름과 날짜를 입력해주세요.")
      return
    }

    const conflict = requests.some(
      (r) =>
        r.date === date &&
        startTime < r.endTime &&
        endTime > r.startTime
    )

    if (conflict) {
      alert("이미 예약된 시간입니다.")
      return
    }

    await addDoc(collection(db, "requests"), {
      name,
      date,
      startTime,
      endTime,
      status: "대기중",
      createdAt: Date.now()
    })

    setName("")
    await fetchRequests()

    alert("신청 완료!")
  }

  const handleApprove = async (id) => {
    await updateDoc(doc(db, "requests", id), {
      status: "승인됨"
    })

    fetchRequests()
  }

  const handleReject = async (id) => {
    await updateDoc(doc(db, "requests", id), {
      status: "거절됨"
    })

    fetchRequests()
  }

  const handleDelete = async (id) => {
    if (!window.confirm("삭제하시겠습니까?")) return

    await deleteDoc(doc(db, "requests", id))
    fetchRequests()
  }

  const getStatusColor = (status) => {
    if (status === "승인됨") return "#16a34a"
    if (status === "거절됨") return "#dc2626"
    return "#f59e0b"
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        padding: "40px 20px"
      }}
    >
      <div
        style={{
          maxWidth: "500px",
          margin: "0 auto",
          backgroundColor: "white",
          borderRadius: "20px",
          padding: "30px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
        }}
      >
        <h1
          style={{
            textAlign: "center",
            fontSize: "32px",
            fontWeight: "900",
            color: "#111827",
            marginBottom: "20px"
          }}
        >
          추가학습 신청
        </h1>

        <button
          onClick={() => setShowAdminLogin(!showAdminLogin)}
          style={{
            width: "100%",
            padding: "12px",
            border: "none",
            borderRadius: "10px",
            backgroundColor: "#111827",
            color: "white",
            fontWeight: "700",
            cursor: "pointer",
            marginBottom: "15px"
          }}
        >
          관리자 로그인
        </button>

        {showAdminLogin && (
          <div style={{ marginBottom: "20px" }}>
            <input
              type="password"
              placeholder="관리자 비밀번호"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "10px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                boxSizing: "border-box"
              }}
            />

            <button
              onClick={() => {
                if (adminPassword === "1234") {
                  setIsAdmin(true)
                  setShowAdminLogin(false)
                  setAdminPassword("")
                  alert("관리자 로그인 성공")
                } else {
                  alert("비밀번호가 틀렸습니다.")
                }
              }}
              style={{
                width: "100%",
                padding: "12px",
                border: "none",
                borderRadius: "10px",
                backgroundColor: "#2563eb",
                color: "white",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              로그인
            </button>
          </div>
        )}

        <p>반 / 이름</p>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: A반 홍길동"
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "12px",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
            boxSizing: "border-box"
          }}
        />

        <p>날짜</p>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "12px",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
            boxSizing: "border-box"
          }}
        />

        <p>시작 시간</p>

        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "12px",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
            boxSizing: "border-box"
          }}
        />

        <p>종료 시간</p>

        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "20px",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
            boxSizing: "border-box"
          }}
        />

        <button
          onClick={handleSubmit}
          style={{
            width: "100%",
            padding: "12px",
            border: "none",
            borderRadius: "10px",
            backgroundColor: "#2563eb",
            color: "white",
            fontWeight: "700",
            cursor: "pointer",
            marginBottom: "20px"
          }}
        >
          신청하기
        </button>

        <h3>신청 목록</h3>

        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "15px",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
            boxSizing: "border-box"
          }}
        />

        {requests
          .filter((r) => !filterDate || r.date === filterDate)
          .map((request) => (
            <div
              key={request.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                padding: "12px",
                marginBottom: "12px"
              }}
            >
              <p><strong>{request.name}</strong></p>
              <p>{request.date}</p>
              <p>{request.startTime} ~ {request.endTime}</p>

              <p
                style={{
                  color: getStatusColor(request.status),
                  fontWeight: "700"
                }}
              >
                {request.status}
              </p>

              {isAdmin && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => handleApprove(request.id)}>승인</button>
                  <button onClick={() => handleReject(request.id)}>거절</button>
                  <button onClick={() => handleDelete(request.id)}>삭제</button>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  )
}

export default App