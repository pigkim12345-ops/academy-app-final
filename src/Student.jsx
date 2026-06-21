import "./Student.css"
import { useEffect, useMemo, useState } from "react"
import app from "./firebase"
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "firebase/firestore"

const db = getFirestore(app)

const classes = {
  "1학년": ["A", "B", "Q", "S", "T", "Z"],
  "2학년": ["A", "B", "K", "M", "Z"],
  "3학년": ["미적", "확통"]
}

const weekdays = ["일", "월", "화", "수", "목", "금", "토"]
const startTimeOptions = Array.from({ length: 13 }, (_, index) => {
  const hour = index + 10
  return `${String(hour).padStart(2, "0")}:00`
})
const durationOptions = ["1시간", "2시간", "3시간", "4시간", "4시간 이상"]

const formatDateKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const formatKoreanDate = (dateKey) => {
  if (!dateKey) return "날짜를 선택해주세요"
  const [year, month, day] = dateKey.split("-")
  return `${Number(month)}월 ${Number(day)}일`
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

const calculateEndTime = (startTime, duration) => {
  if (duration === "4시간 이상") return ""

  const [hour] = startTime.split(":").map(Number)
  const durationHour = Number(duration.replace("시간", ""))
  return `${String(hour + durationHour).padStart(2, "0")}:00`
}

const getRequestTimeLabel = (request) => {
  if (request.duration) {
    return `${request.startTime}부터 ${request.duration}`
  }

  return `${request.startTime} ~ ${request.endTime}`
}

function Student() {
  const todayKey = formatDateKey(new Date())
  const [grade, setGrade] = useState("")
  const [className, setClassName] = useState("")
  const [name, setName] = useState("")
  const [selectedDate, setSelectedDate] = useState(todayKey)
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [startTime, setStartTime] = useState("10:00")
  const [duration, setDuration] = useState("1시간")
  const [requests, setRequests] = useState([])

  const fetchRequests = async () => {
    const snapshot = await getDocs(collection(db, "requests"))
    const data = []

    snapshot.forEach((requestDoc) => {
      data.push({ id: requestDoc.id, ...requestDoc.data() })
    })

    setRequests(data)
  }

  useEffect(() => {
    fetchRequests()
  }, [])

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

  const selectedRequests = useMemo(() => {
    return requests
      .filter((request) => request.date === selectedDate)
      .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""))
  }, [requests, selectedDate])

  const myRequests = selectedRequests.filter((request) => {
    return (
      grade &&
      className &&
      name.trim() &&
      request.grade === grade &&
      request.className === className &&
      request.name.trim() === name.trim()
    )
  })

  const moveMonth = (amount) => {
    setCalendarMonth(
      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + amount, 1)
    )
  }

  const handleSubmit = async () => {
    if (!grade || !className || !name.trim() || !selectedDate) {
      alert("학년, 반, 이름, 날짜를 모두 입력해주세요.")
      return
    }

    const endTime = calculateEndTime(startTime, duration)

    await addDoc(collection(db, "requests"), {
      grade,
      className,
      name: name.trim(),
      date: selectedDate,
      startTime,
      endTime,
      duration,
      attendance: "미출석",
      memo: "",
      createdAt: Date.now()
    })

    await fetchRequests()
    alert("신청 완료!")
  }

  const cancelRequest = async (id) => {
    if (!window.confirm("이 신청을 취소할까요?")) return

    await deleteDoc(doc(db, "requests", id))
    fetchRequests()
  }

  return (
    <main className="studentPage">
      <section className="hero">
        <h1>추가학습 신청</h1>
        <p>날짜를 누르면 신청 현황과 신청 입력칸이 열립니다.</p>
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

      <section className="selectedPanel">
        <div className="sectionTitle">
          <h2>{formatKoreanDate(selectedDate)} 신청 현황</h2>
          <span>{selectedRequests.length}명</span>
        </div>

        {selectedRequests.length === 0 ? (
          <p className="emptyText">아직 신청자가 없습니다.</p>
        ) : (
          <div className="requestList">
            {selectedRequests.map((request) => {
              const canCancel = myRequests.some((myRequest) => myRequest.id === request.id)

              return (
                <article key={request.id} className="requestCard">
                  <div>
                    <strong>{request.name}</strong>
                    <p>
                      {request.grade} {request.className}
                    </p>
                  </div>
                  <div className="timeBlock">
                    {getRequestTimeLabel(request)}
                  </div>
                  {canCancel && (
                    <button
                      type="button"
                      className="cancelButton"
                      onClick={() => cancelRequest(request.id)}
                    >
                      취소
                    </button>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="formPanel">
        <h2>{formatKoreanDate(selectedDate)} 신청하기</h2>

        <label>
          학년
          <select
            value={grade}
            onChange={(event) => {
              setGrade(event.target.value)
              setClassName("")
            }}
          >
            <option value="">선택</option>
            <option value="1학년">1학년</option>
            <option value="2학년">2학년</option>
            <option value="3학년">3학년</option>
          </select>
        </label>

        <label>
          반
          <select
            value={className}
            onChange={(event) => setClassName(event.target.value)}
            disabled={!grade}
          >
            <option value="">선택</option>
            {grade &&
              classes[grade].map((classItem) => (
                <option key={classItem} value={classItem}>
                  {classItem}
                </option>
              ))}
          </select>
        </label>

        <label>
          이름
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="이름 입력"
          />
        </label>

        <div className="timeInputs">
          <label>
            시작 시간
            <select
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            >
              {startTimeOptions.map((time) => (
                <option key={time} value={time}>
                  {Number(time.slice(0, 2))}시
                </option>
              ))}
            </select>
          </label>

          <label>
            이용 시간
            <select
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
            >
              {durationOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button type="button" className="submitButton" onClick={handleSubmit}>
          신청하기
        </button>

        <p className="helperText">
          신청 후 같은 학년, 반, 이름을 입력하면 해당 신청의 취소 버튼이 보입니다.
        </p>
      </section>
    </main>
  )
}

export default Student
