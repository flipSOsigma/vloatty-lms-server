# LMS API Documentation

This document describes all available REST API endpoints for the Learning Management System (LMS) backend.

## Base URL
All API requests must be sent to:
```
http://localhost:5000/api
```

---

## Authentication

Some endpoints require authentication. To access protected endpoints, you must send an `Authorization` header containing your JSON Web Token (JWT):

```http
Authorization: Bearer <your_access_token>
```

### Seeded Credentials
During seeding, a main user is created with the following credentials:
*   **Email**: `turing.y@vloatty.edu`
*   **Password**: `password123`

---

## Endpoint List

### 1. Authentication Routes

#### Register a New User
*   **Method**: `POST`
*   **Path**: `/auth/register`
*   **Request Body**:
    ```json
    {
      "name": "Jane Doe",
      "email": "jane@vloatty.edu",
      "password": "mySecurePassword123",
      "premiumStatus": "free",
      "institution": "Vloatty University",
      "avatar": ""
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "user": {
        "id": "u-uuid-here",
        "name": "Jane Doe",
        "email": "jane@vloatty.edu",
        "premiumStatus": "free",
        "institution": "Vloatty University",
        "avatar": "",
        "createdAt": "2026-06-10T12:00:00.000Z",
        "updatedAt": "2026-06-10T12:00:00.000Z"
      },
      "jwt": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
        "tokenType": "Bearer",
        "expiresIn": 86400
      }
    }
    ```

#### Login User
*   **Method**: `POST`
*   **Path**: `/auth/login`
*   **Request Body**:
    ```json
    {
      "email": "turing.y@vloatty.edu",
      "password": "password123"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "user": {
        "id": "c9c15c47-469a-412f-8431-21568eaf35d4",
        "name": "Turing Yeager",
        "email": "turing.y@vloatty.edu",
        "premiumStatus": "professional",
        "institution": "Vloatty University",
        "avatar": "",
        "createdAt": "2026-06-10T12:00:00.000Z",
        "updatedAt": "2026-06-10T12:00:00.000Z"
      },
      "jwt": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
        "tokenType": "Bearer",
        "expiresIn": 86400
      }
    }
    ```

#### Get Authenticated User Profile
*   **Method**: `GET`
*   **Path**: `/auth/me`
*   **Authentication**: Required
*   **Response (200 OK)**:
    ```json
    {
      "id": "c9c15c47-469a-412f-8431-21568eaf35d4",
      "name": "Turing Yeager",
      "email": "turing.y@vloatty.edu",
      "premiumStatus": "professional",
      "institution": "Vloatty University",
      "avatar": "",
      "createdAt": "2026-06-10T12:00:00.000Z",
      "updatedAt": "2026-06-10T12:00:00.000Z"
    }
    ```

---

### 2. User Routes

#### List All Users
*   **Method**: `GET`
*   **Path**: `/users`
*   **Response (200 OK)**:
    ```json
    [
      {
        "id": "c9c15c47-469a-412f-8431-21568eaf35d4",
        "name": "Turing Yeager",
        "email": "turing.y@vloatty.edu",
        "premiumStatus": "professional",
        "institution": "Vloatty University",
        "avatar": ""
      }
    ]
    ```

#### Get User Profile by ID
*   **Method**: `GET`
*   **Path**: `/users/:id`
*   **Response (200 OK)**:
    ```json
    {
      "id": "c9c15c47-469a-412f-8431-21568eaf35d4",
      "name": "Turing Yeager",
      "email": "turing.y@vloatty.edu",
      "premiumStatus": "professional",
      "institution": "Vloatty University",
      "avatar": ""
    }
    ```

#### Update User Profile
*   **Method**: `PUT`
*   **Path**: `/users/:id`
*   **Authentication**: Required (Token must match route ID, or admin)
*   **Request Body**:
    ```json
    {
      "name": "Turing Yeager Updated",
      "institution": "Vloatty University Academic"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "id": "c9c15c47-469a-412f-8431-21568eaf35d4",
      "name": "Turing Yeager Updated",
      "email": "turing.y@vloatty.edu",
      "premiumStatus": "professional",
      "institution": "Vloatty University Academic",
      "avatar": ""
    }
    ```

---

### 3. Subject Routes

#### Get All Active Subjects
*   **Method**: `GET`
*   **Path**: `/subjects`
*   **Response (200 OK)**:
    ```json
    [
      {
        "id": "529cc7ee-d492-4733-bb10-15a3ba1d9218",
        "name": "Mathematics",
        "room": "West camp, Room 312",
        "color": "yellow",
        "description": "Calculus and mathematical modeling courses.",
        "createdBy": "c9c15c47-469a-412f-8431-21568eaf35d4",
        "deletedBy": null,
        "createdAt": "2026-06-10T12:00:00.000Z",
        "updatedAt": "2026-06-10T12:00:00.000Z",
        "deletedAt": null,
        "lecturers": [
          {
            "userId": "u_olivia_123",
            "name": "Dr. Olivia",
            "email": "olivia@vloatty.edu"
          }
        ],
        "schedules": [
          {
            "id": "schedule-uuid",
            "day": "Monday",
            "startTime": "07:00",
            "endTime": "08:40",
            "room": "West camp, Room 312"
          }
        ],
        "modules": [
          {
            "id": "module-uuid",
            "title": "Module 1: Limits & Continuity",
            "desc": "Calculus limits",
            "date": "2026-05-11T08:00:00.000Z",
            "lessons": [
              {
                "id": "lesson-uuid",
                "title": "Lesson 1: Introduction",
                "desc": "Intro to limits",
                "openDate": "2026-05-11T08:00:00.000Z",
                "closeDate": "2026-05-18T08:00:00.000Z",
                "closeType": "open"
              }
            ]
          }
        ]
      }
    ]
    ```

#### Get Subject by ID
*   **Method**: `GET`
*   **Path**: `/subjects/:id`
*   **Response (200 OK)**: Single subject object matching the schema above.

#### Create Subject
*   **Method**: `POST`
*   **Path**: `/subjects`
*   **Authentication**: Required
*   **Request Body**:
    ```json
    {
      "name": "Organic Chemistry II",
      "room": "Hall A, Room 101",
      "color": "pink",
      "description": "Advanced organic synthesis.",
      "lecturers": [
        { "userId": "u_pasteur_123" }
      ],
      "schedules": [
        {
          "day": "Wednesday",
          "startTime": "10:00",
          "endTime": "11:40",
          "room": "Hall A, Room 101"
        }
      ]
    }
    ```
*   **Response (201 Created)**: Created subject profile JSON.

#### Update Subject
*   **Method**: `PUT`
*   **Path**: `/subjects/:id`
*   **Authentication**: Required
*   **Request Body**:
    ```json
    {
      "name": "Organic Chemistry II Revised",
      "schedules": [
        {
          "day": "Wednesday",
          "startTime": "10:00",
          "endTime": "11:40",
          "room": "Main Auditorium"
        }
      ]
    }
    ```
*   **Response (200 OK)**: Updated subject profile JSON.

#### Delete Subject (Soft Delete)
*   **Method**: `DELETE`
*   **Path**: `/subjects/:id`
*   **Authentication**: Required
*   **Response (200 OK)**:
    ```json
    {
      "message": "Subject deleted successfully"
    }
    ```

---

### 4. Event Routes

#### Get All Active Events
*   **Method**: `GET`
*   **Path**: `/events`
*   **Response (200 OK)**:
    ```json
    [
      {
        "id": "529cc7ee-d492-4733-bb10-15a3ba1d9218-Monday-0",
        "title": "Mathematics",
        "subtitle": "West camp, Room 312",
        "timeStart": "07:00",
        "timeEnd": "08:40",
        "dayIndex": 0,
        "color": "yellow",
        "subjectId": "529cc7ee-d492-4733-bb10-15a3ba1d9218",
        "createdAt": "2026-06-10T12:00:00.000Z",
        "updatedAt": "2026-06-10T12:00:00.000Z",
        "deletedAt": null
      }
    ]
    ```

#### Get Event by ID
*   **Method**: `GET`
*   **Path**: `/events/:id`
*   **Response (200 OK)**: Event object.

#### Create Custom Calendar Event
*   **Method**: `POST`
*   **Path**: `/events`
*   **Authentication**: Required
*   **Request Body**:
    ```json
    {
      "title": "Faculty Meeting",
      "subtitle": "Conference Room B",
      "timeStart": "14:00",
      "timeEnd": "15:30",
      "dayIndex": 3,
      "color": "purple",
      "status": "normal",
      "description": "Weekly administration coordination."
    }
    ```
*   **Response (201 Created)**: Created event JSON.

#### Delete Event (Soft Delete)
*   **Method**: `DELETE`
*   **Path**: `/events/:id`
*   **Authentication**: Required
*   **Response (200 OK)**:
    ```json
    {
      "message": "Event deleted successfully"
    }
    ```
