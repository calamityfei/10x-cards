# Flashcards API Test Requests

Manual curl commands to test the flashcards endpoints. Run these one by one to verify expected behavior.

**Prerequisites**: 
- Dev server running on `http://localhost:4321`
- Database has `DEFAULT_USER_ID` user: `dc154d8b-beb5-4da0-9c64-6c5f7a4f7430`

---

## 1. POST /api/flashcards - Create Flashcards (Success)

**Test**: Create 3 flashcards with different sources

```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "flashcards": [
      {
        "front": "What is REST?",
        "back": "Representational State Transfer - an architectural style for APIs",
        "source": "manual"
      },
      {
        "front": "What is PostgreSQL?",
        "back": "An open-source relational database system",
        "source": "ai_full",
        "generation_id": 1
      },
      {
        "front": "What is Supabase?",
        "back": "An open-source Firebase alternative with PostgreSQL",
        "source": "ai_edited",
        "generation_id": 1
      }
    ]
  }'
```

**Expected**: 201 Created with array of 3 flashcards, each with `id`, timestamps, etc.

---

## 2. POST /api/flashcards - Validation Error (front too long)

**Test**: Try to create flashcard with front > 200 chars

```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "flashcards": [
      {
        "front": "This is a very long question that exceeds the maximum allowed length of 200 characters. This is a very long question that exceeds the maximum allowed length of 200 characters. This is a very long question that exceeds the maximum allowed length of 200 characters.",
        "back": "Answer",
        "source": "manual"
      }
    ]
  }'
```

**Expected**: 400 Bad Request with validation error details

---

## 3. POST /api/flashcards - Validation Error (invalid source)

**Test**: Try to create flashcard with invalid source enum

```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "flashcards": [
      {
        "front": "Question?",
        "back": "Answer",
        "source": "invalid_source"
      }
    ]
  }'
```

**Expected**: 400 Bad Request with validation error

---

## 4. GET /api/flashcards - Get All (Default Pagination)

**Test**: Fetch first page with default settings

```bash
curl -X GET http://localhost:4321/api/flashcards
```

**Expected**: 200 OK with `data` array and `pagination` object (page=1, limit=50)

---

## 5. GET /api/flashcards - With Pagination

**Test**: Fetch page 1 with limit of 2

```bash
curl -X GET "http://localhost:4321/api/flashcards?page=1&limit=2"
```

**Expected**: 200 OK with max 2 flashcards in `data` array

---

## 6. GET /api/flashcards - With Search

**Test**: Search for "PostgreSQL" in front/back fields

```bash
curl -X GET "http://localhost:4321/api/flashcards?search=PostgreSQL"
```

**Expected**: 200 OK with flashcards containing "PostgreSQL" in front or back

---

## 7. GET /api/flashcards - With Sort and Order

**Test**: Sort by front field in ascending order

```bash
curl -X GET "http://localhost:4321/api/flashcards?sort=front&order=asc"
```

**Expected**: 200 OK with flashcards sorted alphabetically by front field

---

## 8. GET /api/flashcards - Validation Error (invalid sort field)

**Test**: Try to sort by non-existent field

```bash
curl -X GET "http://localhost:4321/api/flashcards?sort=invalid_field"
```

**Expected**: 400 Bad Request with validation error

---

## 9. GET /api/flashcards/:id - Get Single Flashcard (Success)

**Test**: Get flashcard with ID 1 (replace with actual ID from step 1)

```bash
curl -X GET http://localhost:4321/api/flashcards/1
```

**Expected**: 200 OK with single flashcard object

---

## 10. GET /api/flashcards/:id - Not Found

**Test**: Try to get non-existent flashcard

```bash
curl -X GET http://localhost:4321/api/flashcards/999999
```

**Expected**: 404 Not Found with error message

---

## 11. GET /api/flashcards/:id - Validation Error (invalid ID)

**Test**: Try to get flashcard with invalid ID format

```bash
curl -X GET http://localhost:4321/api/flashcards/abc
```

**Expected**: 400 Bad Request with validation error

---

## 12. PATCH /api/flashcards/:id - Update Front Only (Success)

**Test**: Update only the front field of flashcard ID 1

```bash
curl -X PATCH http://localhost:4321/api/flashcards/1 \
  -H "Content-Type: application/json" \
  -d '{
    "front": "What is REST API?"
  }'
```

**Expected**: 200 OK with updated flashcard (front changed, back unchanged)

---

## 13. PATCH /api/flashcards/:id - Update Both Fields (Success)

**Test**: Update both front and back fields

```bash
curl -X PATCH http://localhost:4321/api/flashcards/1 \
  -H "Content-Type: application/json" \
  -d '{
    "front": "What is a REST API?",
    "back": "A web service architectural style using HTTP methods"
  }'
```

**Expected**: 200 OK with updated flashcard

---

## 14. PATCH /api/flashcards/:id - Validation Error (no fields)

**Test**: Try to update without providing any fields

```bash
curl -X PATCH http://localhost:4321/api/flashcards/1 \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected**: 400 Bad Request with validation error (at least one field required)

---

## 15. PATCH /api/flashcards/:id - Validation Error (back too long)

**Test**: Try to update with back > 500 chars

```bash
curl -X PATCH http://localhost:4321/api/flashcards/1 \
  -H "Content-Type: application/json" \
  -d '{
    "back": "This is a very long answer that exceeds 500 characters. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. More text to exceed the limit."
  }'
```

**Expected**: 400 Bad Request with validation error

---

## 16. PATCH /api/flashcards/:id - Not Found

**Test**: Try to update non-existent flashcard

```bash
curl -X PATCH http://localhost:4321/api/flashcards/999999 \
  -H "Content-Type: application/json" \
  -d '{
    "front": "Updated question"
  }'
```

**Expected**: 404 Not Found

---

## 17. DELETE /api/flashcards/:id - Success

**Test**: Delete flashcard with ID 3 (use ID from step 1)

```bash
curl -X DELETE http://localhost:4321/api/flashcards/3
```

**Expected**: 204 No Content (empty response body)

---

## 18. DELETE /api/flashcards/:id - Not Found

**Test**: Try to delete already deleted flashcard

```bash
curl -X DELETE http://localhost:4321/api/flashcards/3
```

**Expected**: 404 Not Found

---

## 19. DELETE /api/flashcards/:id - Validation Error (invalid ID)

**Test**: Try to delete with invalid ID format

```bash
curl -X DELETE http://localhost:4321/api/flashcards/invalid
```

**Expected**: 400 Bad Request with validation error

---

## Test Sequence Summary

1. **Create** 3 flashcards (IDs will be returned)
2. **Validate** creation errors (too long, invalid enum)
3. **List** flashcards with various filters
4. **Get** single flashcard by ID
5. **Update** flashcard fields
6. **Delete** flashcard
7. **Verify** 404 errors for non-existent resources

## Notes

- Replace flashcard IDs in tests 9-19 with actual IDs returned from test 1
- Run tests in sequence for best results
- Check server logs for detailed error messages
- Verify `updated_at` timestamp changes after PATCH operations
