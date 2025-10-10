# Backend API Requirements for Student Deletion

## Required Endpoints

### 1. Delete Single Student
**Endpoint:** `DELETE /api/admin/delete-student`

**Request Body:**
```json
{
  "studentId": "firebase_user_id",
  "email": "student@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Student deleted successfully",
  "deletedFrom": ["firestore", "auth"]
}
```

**Implementation Notes:**
- Use Firebase Admin SDK to delete user from Firebase Auth
- Verify admin permissions before deletion
- Handle cases where user might not exist in Auth but exists in Firestore

### 2. Bulk Delete Students (Optional)
**Endpoint:** `DELETE /api/admin/bulk-delete-students`

**Request Body:**
```json
{
  "students": [
    {"id": "user_id_1", "email": "student1@example.com"},
    {"id": "user_id_2", "email": "student2@example.com"}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "deleted": 2,
  "failed": 0,
  "results": [
    {"id": "user_id_1", "status": "deleted"},
    {"id": "user_id_2", "status": "deleted"}
  ]
}
```

## Backend Implementation Example (Node.js)

```javascript
const admin = require('firebase-admin');

// Delete single student
app.delete('/api/admin/delete-student', async (req, res) => {
  try {
    const { studentId, email } = req.body;
    
    // Verify admin permissions here
    
    // Delete from Firebase Auth
    await admin.auth().deleteUser(studentId);
    
    res.json({
      success: true,
      message: 'Student deleted successfully',
      deletedFrom: ['firestore', 'auth']
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

## Security Considerations

1. **Admin Authentication**: Verify that the request comes from an authenticated admin
2. **Rate Limiting**: Implement rate limiting for deletion endpoints
3. **Audit Logging**: Log all deletion operations for audit purposes
4. **Soft Delete Option**: Consider implementing soft delete for data recovery

## Frontend Integration

The frontend will:
1. Delete from Firestore directly (immediate UI update)
2. Call backend API to delete from Firebase Auth
3. Show appropriate success/warning messages based on results
4. Handle graceful degradation if backend is unavailable