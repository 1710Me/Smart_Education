import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { getAllStudentsData } from '../../../services/operations/adminApi'
import { Table, Th, Thead, Tr, Td, Tbody } from 'react-super-responsive-table'
import IconBtn from '../../common/IconBtn'
import { VscAdd } from 'react-icons/vsc'
import user_logo from "../../../assets/Images/user.png"

const LoadingSkeleton = () => {
  return (
    <div className="flex p-5 flex-col gap-6 border-b border-2 border-b-richblack-500">
      <div className="flex flex-col sm:flex-row gap-5 items-center mt-7">
        <p className='h-[150px] w-[150px] rounded-full skeleton'></p>
        <div className="flex flex-col gap-2 ">
          <p className='h-4 w-[160px] rounded-xl skeleton'></p>
          <p className='h-4 w-[270px] rounded-xl skeleton'></p>
          <p className='h-4 w-[100px] rounded-xl skeleton'></p>
        </div>
      </div>
      <div className='flex gap-5'>
        <p className="h-7 w-full sm:w-1/2 rounded-xl skeleton"></p>
        <p className="h-7 w-full sm:w-1/2 rounded-xl skeleton"></p>
        <p className="h-7 w-full sm:w-1/2 rounded-xl skeleton"></p>
      </div>
    </div>
  )
}

const AllStudents = () => {
  const { token } = useSelector((state) => state.auth)
  const [allStudents, setAllStudents] = useState([])
  const [studentsCount, setStudentsCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchAllStudents = async () => {
      setLoading(true)
      setError(null)
      try {
        const { allStudentsDetails, studentsCount } = await getAllStudentsData(token)
        setAllStudents(allStudentsDetails)
        setStudentsCount(studentsCount)
      } catch (err) {
        console.error("Error fetching student data:", err)
        setError("Failed to fetch student data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchAllStudents()
  }, [token])

  if (loading) {
    return (
      <div>
        <LoadingSkeleton />
        <LoadingSkeleton />
        <LoadingSkeleton />
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>
  }

  if (!allStudents || allStudents.length === 0) {
    return <div className='text-5xl py-5 bg-yellow-800 text-white text-center'>No Data Available</div>
  }

  return (
    <div className=''>
      <div className="mb-14 flex items-center justify-between">
        <h1 className="text-4xl font-medium text-richblack-5 font-boogaloo text-center sm:text-left">All Students Details</h1>
        <IconBtn text="Add Students" onclick={() => navigate("")}>
          <VscAdd />
        </IconBtn>
      </div>

      <Table className="rounded-xl border-2 border-richblack-500 ">
        <Thead>
          <Tr className="flex gap-x-10 rounded-t-md border-b border-2 border-b-richblack-500 px-6 py-2">
            <Th className="flex-1 text-left text-sm font-medium uppercase text-richblack-100">
              Students : {studentsCount}
            </Th>
            <Th className="mr-[10%] text-center ml-4 text-sm font-medium uppercase text-richblack-100 ">
              ACTIVE
            </Th>
            <Th className="mr-[7%] text-sm font-medium uppercase text-richblack-100">
              APPROVED
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {allStudents.map((student) => (
            <Tr key={student._id} className="flex gap-x-10 px-6 py-8 border-b border-richblack-500">
              <Td className="flex flex-1 gap-x-2">
                <img
                  src={student.image !== "/" ? student.image : user_logo}
                  alt="student"
                  className="h-[150px] w-[150px] rounded-full"
                />
                <div className="flex flex-col justify-between">
                  <p className="text-lg font-semibold text-richblack-5">{student.firstName} {student.lastName}</p>
                  <p className="text-sm text-richblack-300">{student.email}</p>
                  <p className="text-sm text-richblack-300">
                    Gender: {student.additionalDetails?.gender || "Not defined"}
                  </p>
                  <p className="text-sm text-richblack-300">
                    Mobile: {student.additionalDetails?.contactNumber || "No Data"}
                  </p>
                  <p className="text-sm text-richblack-300">
                    DOB: {student.additionalDetails?.dateOfBirth || "No Data"}
                  </p>
                </div>
              </Td>
              <Td className="mr-[11.5%] text-sm font-medium text-richblack-100">
                {student.active ? "Active" : "Inactive"}
              </Td>
              <Td className="mr-[8%] text-sm font-medium text-richblack-100">
                {student.approved ? "Approved" : "Not Approved"}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </div>
  )
}

export default AllStudents