import "./Admin.css"
import { useMemo, useState, useEffect } from "react"
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

const weekdays = ["일", "월", "화", "수", "목", "금", "토"]

const formatDateKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const formatKoreanDate = (dateKey) => {
  if (!dateKey) return "전체 날짜"
  const [year, month, day] = dateKey.split("-")
  return `${year}년 ${Number(month)}월 ${Number(day)}일`
}

const buildCalendarDays = (baseDate) => {
  const year = baseDate.getFullYear()
  const month = baseDate.getMonth()
  const firstDate = new Date(year, month, 1)
  const lastDate = new Date(year, month + 1, 0)
  const days = []

  for (let i = 0; i < firstDate.getDay(); i += 1) {
    days.push(null)
  }

  for (let day = 1; day <= lastDate.getDate(); day += 1) {
    days.push(new Date(year, month, day))
  }

  return days
}

const getRequestTimeLabel = (request) => {
  if (request.duration) {
    return `${request.startTime}부터 ${request.duration}`
  }

  return `${request.startTime} ~ ${request.endTime}`
}

function Admin() {
  const todayKey = formatDateKey(new Date())
  const [password, setPassword] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [requests, setRequests] = useState([])
  const [selectedDate, setSelectedDate] = useState(todayKey)
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [selectedGrade, setSelectedGrade] = useState("")
  const [selectedClass, setSelectedClass] = useState("")
  const [searchName, setSearchName] = useState("")

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

  const calendarDays = useMemo(
    () => buildCalendarDays(calendarMonth),
    [calendarMonth]
  )

  const requestsByDate = useMemo(() => {
    return requests.reduce((acc, request) => {
      acc[request.date] = (acc[request.date] || 0) + 1
      return acc
    }, {})
  }, [requests])

  const filteredRequests = useMemo(() => {
    return requests
      .filter((request) => {
        const matchDate = selectedDate ? request.date === selectedDate : true
        const matchGrade = selectedGrade ? request.grade === selectedGrade : true
        const matchClass = selectedClass ? request.className === selectedClass : true
        const matchName = searchName.trim()
          ? request.name?.includes(searchName.trim())
          : true

        return matchDate && matchGrade && matchClass && matchName
      })
      .sort((a, b) => {
        const timeA = `${a.date || ""}${a.startTime || ""}`
        const timeB = `${b.date || ""}${b.startTime || ""}`
        return timeA.localeCompare(timeB)
      })
  }, [requests, selectedDate, selectedGrade, selectedClass, searchName])

  const selectedDateRequests = requests.filter(
    (request) => request.date === selectedDate
  )
  const selectedAttendanceCount = selectedDateRequests.filter(
    (request) => request.attendance === "출석"
  ).length
  const selectedAbsentCount = selectedDateRequests.length - selectedAttendanceCount

  const login = () => {
    if (password === "1234") setIsAdmin(true)
    else alert("비밀번호가 틀렸습니다.")
  }

  const moveMonth = (amount) => {
    setCalendarMonth(
      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + amount, 1)
    )
  }

  const toggleAttendance = async (id, current) => {
    const newStatus = current === "출석" ? "미출석" : "출석"

    await updateDoc(doc(db, "requests", id), {
      attendance: newStatus
    })

    fetchRequests()
  }

  const updateMemo = async (id, value) => {
    await updateDoc(doc(db, "requests", id), {
      memo: value
    })

    fetchRequests()
  }

  const remove = async (id) => {
    if (!window.confirm("이 신청을 삭제할까요?")) return

    await deleteDoc(doc(db, "requests", id))
    fetchRequests()
  }

  if (!isAdmin) {
    return (
      <main className="adminPage loginPage">
        <section className="loginPanel">
          <h1>관리자 로그인</h1>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="비밀번호"
          />
          <button type="button" onClick={login}>
            로그인
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="adminPage">
      <section className="adminHeader">
        <div>
          <h1>관리자 페이지</h1>
          <p>캘린더에서 날짜를 선택해 신청자를 관리합니다.</p>
        </div>
        <button type="button" className="refreshButton" onClick={fetchRequests}>
          새로고침
        </button>
      </section>

      <section className="statsGrid">
        <div>
          <span>{formatKoreanDate(selectedDate)} 신청</span>
          <strong>{selectedDateRequests.length}명</strong>
        </div>
        <div>
          <span>출석</span>
          <strong>{selectedAttendanceCount}명</strong>
        </div>
        <div>
          <span>미출석</span>
          <strong>{selectedAbsentCount}명</strong>
        </div>
      </section>

      <section className="calendarPanel">
        <div className="calendarHeader">
          <button type="button" onClick={() => moveMonth(-1)} aria-label="이전 달">
            ‹
          </button>
          <strong>
            {calendarMonth.getFullYear()}년 {calendarMonth.getMonth() + 1}월
          </strong>
          <button type="button" onClick={() => moveMonth(1)} aria-label="다음 달">
            ›
          </button>
        </div>

        <div className="weekdays">
          {weekdays.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="calendarGrid">
          {calendarDays.map((day, index) => {
            if (!day) return <div key={`empty-${index}`} className="emptyDay" />

            const dateKey = formatDateKey(day)
            const requestCount = requestsByDate[dateKey] || 0

            return (
              <button
                key={dateKey}
                type="button"
                className={`dayButton ${selectedDate === dateKey ? "selected" : ""}`}
                onClick={() => setSelectedDate(dateKey)}
              >
                <span>{day.getDate()}</span>
                {requestCount > 0 && <small>{requestCount}명</small>}
              </button>
            )
          })}
        </div>
      </section>

      <section className="filterPanel">
        <input
          value={searchName}
          onChange={(event) => setSearchName(event.target.value)}
          placeholder="이름 검색"
        />

        <select
          value={selectedGrade}
          onChange={(event) => {
            setSelectedGrade(event.target.value)
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
          onChange={(event) => setSelectedClass(event.target.value)}
          disabled={!selectedGrade}
        >
          <option value="">전체 반</option>
          {selectedGrade &&
            classMap[selectedGrade].map((classItem) => (
              <option key={classItem} value={classItem}>
                {classItem}
              </option>
            ))}
        </select>

        <button
          type="button"
          onClick={() => {
            setSelectedDate(todayKey)
            setCalendarMonth(new Date())
            setSelectedGrade("")
            setSelectedClass("")
            setSearchName("")
          }}
        >
          초기화
        </button>
      </section>

      <section className="requestSection">
        <div className="sectionTitle">
          <h2>{formatKoreanDate(selectedDate)}</h2>
          <span>{filteredRequests.length}명</span>
        </div>

        {filteredRequests.length === 0 ? (
          <p className="emptyText">조건에 맞는 신청이 없습니다.</p>
        ) : (
          filteredRequests.map((request) => (
            <article key={request.id} className="card">
              <div className="cardTop">
                <div>
                  <strong>{request.name}</strong>
                  <p>
                    {request.grade} {request.className}
                  </p>
                </div>
                <span>{request.attendance || "미출석"}</span>
              </div>

              <p className="timeText">
                {request.date} {getRequestTimeLabel(request)}
              </p>

              <textarea
                placeholder="관리자 메모"
                value={request.memo || ""}
                onChange={(event) => updateMemo(request.id, event.target.value)}
              />

              <div className="btnGroup">
                <button
                  type="button"
                  onClick={() => toggleAttendance(request.id, request.attendance)}
                >
                  출석 토글
                </button>

                <button
                  type="button"
                  className="delete"
                  onClick={() => remove(request.id)}
                >
                  삭제
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  )
}

export default Admin
