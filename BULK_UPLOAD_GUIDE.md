# Bulk Student Upload Guide

## Overview
The bulk upload feature uses AI-powered column detection to automatically map your Excel data to the required student fields. You can use any Excel format - the AI will intelligently extract the information.

## Setup Instructions

### 1. Get Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file:
   ```
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```

### 2. Prepare Your Excel File
The AI can handle any Excel format, but here are the fields it looks for:

**Required Fields:**
- Name (full name of student)
- Email (email address)

**Optional Fields:**
- Phone Number
- Register Number
- Roll Number
- Department/Branch
- Year of Study (1-4)
- College
- 10th Percentage
- 12th Percentage
- GitHub URL
- LeetCode URL
- Codeforces URL
- AtCoder URL
- HackerRank URL
- LinkedIn URL
- Resume/Drive URL

### 3. AI Features
- **Smart Column Detection**: Automatically maps columns regardless of naming
- **URL Extraction**: Extracts URLs from text containing additional information
- **Format Flexibility**: Handles any Excel structure
- **Data Validation**: Validates and cleans data before processing

## Example Excel Formats

### Format 1: Standard Columns
| Name | Email | Department | Year | GitHub | LeetCode |
|------|-------|------------|------|--------|----------|
| John Doe | john@example.com | CSE | 3 | github.com/johndoe | leetcode.com/johndoe |

### Format 2: Mixed Content (AI will extract URLs)
| Student Name | Email Address | Branch | Study Year | GitHub Profile | LeetCode Profile |
|--------------|---------------|--------|------------|----------------|------------------|
| Jane Smith | jane@example.com | IT | 2 | Check out my GitHub: github.com/janesmith | My LeetCode: leetcode.com/janesmith (500+ problems) |

### Format 3: Different Column Names
| Full Name | Email ID | Dept | Academic Year | Git Hub | Leet Code |
|-----------|----------|------|---------------|---------|-----------|
| Bob Wilson | bob@example.com | ECE | 4 | github.com/bobwilson | leetcode.com/bobwilson |

## Usage Steps

1. **Switch to Bulk Mode**: Click "Bulk Upload" tab in the admin panel
2. **Upload Excel**: Choose your .xlsx or .xls file
3. **AI Processing**: The system will automatically process and map your data
4. **Preview**: Review the detected students and their information
5. **Upload**: Click "Upload X Students" to process all students
6. **Results**: View detailed results with temporary passwords for successful additions

## Features

- **Batch Processing**: Upload up to 60+ students simultaneously
- **Error Handling**: Detailed error reporting for failed entries
- **Password Generation**: Automatic secure temporary password generation
- **Duplicate Detection**: Prevents duplicate email addresses
- **Progress Tracking**: Real-time processing status
- **Results Export**: Copy all passwords to clipboard for easy sharing

## Troubleshooting

- **Empty File**: Ensure your Excel file contains data
- **Missing Required Fields**: Name and Email are mandatory
- **API Key Error**: Verify your Gemini API key is correctly set
- **Processing Timeout**: Large files may take a few minutes to process

## Security Notes

- Temporary passwords are securely generated and stored
- Students must change passwords on first login
- All data is validated before storage
- Failed entries are logged with specific error messages