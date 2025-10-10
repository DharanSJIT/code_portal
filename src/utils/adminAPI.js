// Admin API utilities for backend operations

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const deleteStudentAccount = async (studentId, email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/delete-student`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentId,
        email
      })
    });

    if (!response.ok) {
      throw new Error('Failed to delete student from Firebase Auth');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting student account:', error);
    throw error;
  }
};

export const bulkDeleteStudents = async (students) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/bulk-delete-students`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        students: students.map(s => ({ id: s.id, email: s.email }))
      })
    });

    if (!response.ok) {
      throw new Error('Failed to bulk delete students');
    }

    return await response.json();
  } catch (error) {
    console.error('Error bulk deleting students:', error);
    throw error;
  }
};