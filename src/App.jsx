import { BrowserRouter, Routes, Route } from "react-router-dom"
import Student from "./Student"
import Admin from "./Admin"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Student />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App