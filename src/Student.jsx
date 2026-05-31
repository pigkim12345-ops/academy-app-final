import "./Student.css"
import { useEffect, useState } from "react"
import app from "./firebase"
import {
  getFirestore,
  collection,
  addDoc,
  getDocs
} from "firebase/firestore"

const db = getFirestore(app)

const classes = {
  "1학년": ["A", "B", "Q", "S", "T", "Z"],
  "2학년": ["A", "B", "K", "M", "Z"],
  "3학년": ["미적", "확통"]
}

function Student() {
  const [grade, setGrade] = useState("")
  const [className, setClassName] = useState("")
  const [name, setName] = useState("")
  const [date, setDate] = useState("")
  const [startTime, setStartTime] = useState("12:00")
  const [endTime, setEndTime] = useState("13:00")

  const [requests, setRequests] = useState([])

  const fetchRequests = async () => {
    const snapshot = await getDocs(collection(db, "requests"))
    const data = []

    snapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() })
    })

    setRequests(data)
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleSubmit = async () => {
    if (!grade || !className || !name || !date) {
      alert("모든 정보를 입력해주세요.")
      return
    }

    await addDoc(collection(db, "requests"), {
      grade,
      className,
      name,
      date,
      startTime,
      endTime,
      status: "대기중",
      attendance: "미출석",   // 🔥 추가됨
      createdAt: Date.now()
    })

    setGrade("")
    setClassName("")
    setName("")
    fetchRequests()

    alert("신청 완료!")
  }

  return (
    <div className="container">
      <h1>추가학습 신청</h1>

      <p>학년</p>
      <select value={grade} onChange={(e) => setGrade(e.target.value)}>
        <option value="">선택</option>
        <option value="1학년">1학년</option>
        <option value="2학년">2학년</option>
        <option value="3학년">3학년</option>
      </select>

      <p>반</p>
      <select
        value={className}
        onChange={(e) => setClassName(e.target.value)}
        disabled={!grade}
      >
        <option value="">선택</option>
        {grade &&
          classes[grade].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
      </select>

      <p>이름</p>
      <input value={name} onChange={(e) => setName(e.target.value)} />

      <p>날짜</p>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

      <p>시작</p>
      <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />

      <p>종료</p>
      <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />

      <button onClick={handleSubmit}>신청하기</button>
    </div>
  )
}

export default Student