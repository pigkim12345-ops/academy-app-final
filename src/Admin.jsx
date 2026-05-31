import "./Admin.css"
import { useState, useEffect } from "react"
import app from "./firebase"
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc
} from "firebase/firestore"

const db = getFirestore(app)

const classMap = {
  "1학년": ["A", "B", "Q", "S", "T", "Z"],
  "2학년": ["A", "B", "K", "M", "Z"],
  "3학년": ["미적", "확통"]
}

function Admin() {
  const [password, setPassword] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)

  const [requests, setRequests] = useState([])

  // 🔥 필터
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedGrade, setSelectedGrade] = useState("")
  const [selectedClass, setSelectedClass] = useState("")

  const fetchRequests = async () => {
    const snapshot = await getDocs(collection(db, "requests"))
    const data = []

    snapshot.forEach((docItem) => {
      data.push({ id: docItem.id, ...docItem.data() })
    })

    setRequests(data)
  }

  useEffect(() => {
    if (isAdmin) fetchRequests()
  }, [isAdmin])

  const login = () => {
    if (password === "1234") setIsAdmin(true)
    else alert("비밀번호 틀림")
  }

  // 출석 토글
  const toggleAttendance = async (id, current) => {
    const newStatus = current === "출석" ? "미출석" : "출석"

    await updateDoc(doc(db, "requests", id), {
      attendance: newStatus
    })

    fetchRequests()
  }

  // 메모 수정
  const updateMemo = async (id, value) => {
    await updateDoc(doc(db, "requests", id), {
      memo: value
    })

    fetchRequests()
  }

  // 삭제
  const remove = async (id) => {
    await deleteDoc(doc(db, "requests", id))
    fetchRequests()
  }

  // 🔥 필터 + 정렬
  const filteredRequests = requests
    .filter((r) => {
      const matchDate = selectedDate ? r.date === selectedDate : true
      const matchGrade = selectedGrade ? r.grade === selectedGrade : true
      const matchClass = selectedClass ? r.className === selectedClass : true

      return matchDate && matchGrade && matchClass
    })
    .sort((a, b) => {
      const timeA = a.date + a.startTime
      const timeB = b.date + b.startTime
      return timeA.localeCompare(timeB)
    })

  if (!isAdmin) {
    return (
      <div className="container">
        <h2>관리자 로그인</h2>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={login}>로그인</button>
      </div>
    )
  }

  return (
    <div className="container">
      <h2>관리자 페이지</h2>

      {/* 🔥 필터 영역 */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />

        <select
          value={selectedGrade}
          onChange={(e) => {
            setSelectedGrade(e.target.value)
            setSelectedClass("")
          }}
        >
          <option value="">전체 학년</option>
          <option value="1학년">1학년</option>
          <option value="2학년">2학년</option>
          <option value="3학년">3학년</option>
        </select>

        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          disabled={!selectedGrade}
        >
          <option value="">전체 반</option>
          {selectedGrade &&
            classMap[selectedGrade].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
        </select>

        <button
          onClick={() => {
            setSelectedDate("")
            setSelectedGrade("")
            setSelectedClass("")
          }}
        >
          전체 초기화
        </button>
      </div>

      {/* 리스트 */}
      {filteredRequests.map((r) => (
        <div key={r.id} className="card">
          <p>
            {r.grade} {r.className} {r.name}
          </p>

          <p>
            {r.date} {r.startTime} ~ {r.endTime}
          </p>

          <p>
            출석: {r.attendance || "미출석"}
          </p>

          {/* 메모 */}
          <textarea
            placeholder="관리자 메모"
            value={r.memo || ""}
            onChange={(e) => updateMemo(r.id, e.target.value)}
            style={{
              width: "100%",
              marginTop: 10,
              padding: 8,
              borderRadius: 8
            }}
          />

          <div className="btnGroup">
            <button onClick={() => toggleAttendance(r.id, r.attendance)}>
              출석 토글
            </button>

            <button className="delete" onClick={() => remove(r.id)}>
              삭제
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default Admin