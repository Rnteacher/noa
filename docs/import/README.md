# מדריך מילוי קבצי יבוא נתונים / Roster Import Guide

---

## עברית (Hebrew)

מדריך זה מפרט את ההנחיות למילוי קבצי ה-CSV לצורך יבוא נתוני תלמידים וצוות עבור הרצת הפיילוט הראשונה של האפליקציה.

> [!WARNING]
> **אבטחת מידע ומניעת דליפה**
> - **אל תתחייב (Do not commit) קבצים המכילים נתונים אמיתיים לתוך ה-Git repository.**
> - **אל תדביק נתונים אמיתיים של תלמידים או אנשי צוות בצ'אט עם ה-AI.**
> - שמור את כל הקבצים המלאים בתיקייה מקומית מאובטחת **מחוץ** לתיקיית הפרויקט.
> - השתמש אך ורק בכתובות אימייל מוסדיות מורשות של אנשי הצוות.

### סדר מילוי הקבצים המומלץ
1. **מניפסט יבוא (Import Manifest)**: הגדרת שנת הלימודים ופרטי מנהל המידע.
2. **אישורי גישה לצוות (Staff Access Grants)**: הזנת רשימת המיילים המורשים להיכנס למערכת.
3. **תפקידי צוות (Staff Roles)**: הגדרת התפקידים השונים לכל איש צוות.
4. **קבוצות תלמידים (Student Groups)**: הגדרת כיתות/קבוצות הלימוד.
5. **תלמידים (Students)**: רשימת התלמידים ופרטי הקשר של ההורים.
6. **מנטורים של קבוצות (Group Mentors)**: שיוך מנטורים מהצוות לקבוצות התלמידים.
7. **פרויקטים (Projects)**: הגדרת כותרת הפרויקט וסטטוס התחלתי של כל תלמיד.
8. **מאסטרים לפרויקט (Student Masters)**: שיוך מנחה מקצועי (מאסטר) לפרויקט של תלמיד.
9. **מטרות למידה (Student Goals)**: הגדרת מטרת למידה מרכזית ראשונית לכל תלמיד.
10. **בסיס סטטוס רגשי (Emotional Status Baseline)**: רגיש מאוד - השאר קובץ זה ריק אלא אם אושר מפורשות על ידי מנהל הפיילוט.

---

### ערכים מותרים ופורמטים (Allowed Values & Formats)

- **תפקידי צוות (Roles)**: 
  `staff`, `mentor`, `master`, `counselor`, `leadership`, `manager`, `super_admin`
- **סטטוס פרויקט / רגשי (Statuses)**: 
  `green`, `yellow`, `red`
- **סטטוס מטרה (Goal Status)**: 
  `active`, `completed`, `paused`, `archived`
- **ערכים בוליאניים (Booleans)**: 
  `true`, `false` (באותיות קטנות בלבד)
- **פורמט תאריך (Date Format)**: 
  `YYYY-MM-DD` (לדוגמה: `2025-09-01`)
- **מזהה תלמיד חיצוני (external_student_id)**: 
  מזהה ייחודי זמני (למשל, מספר סידורי של בית הספר) המשמש אך ורק לקישור בין הטבלאות במהלך היבוא. המערכת תייצר מזהי UUID אקראיים והמזהה החיצוני לא יישמר בבסיס הנתונים לטווח ארוך.

---

### צ'קליסט לבדיקת קבצים לפני מסירה
- [ ] כל כותרות העמודות (Headers) זהות בדיוק לטבלאות התבנית (Template) ובאנגלית.
- [ ] אין שורות ריקות או עמודות חסרות בקבצי החובה.
- [ ] כתובות האימייל של הצוות נכתבו באותיות קטנות בלבד (lowercase).
- [ ] מזהי ה-`external_student_id` של התלמידים תואמים בדיוק בין קובץ התלמידים לקבצי הפרויקטים, המטרות והמאסטרים.
- [ ] אין שימוש בתווים מיוחדים שאינם נתמכים בפורמט CSV סטנדרטי (UTF-8).
- [ ] סטטוס רגשי (Emotional Status) הושאר ריק אלא אם כן התקבל אישור בכתב.

### הנחיות מסירה
יש להעביר את הקבצים המוכנים בערוץ תקשורת בית-ספרי מאובטח המאושר על ידי הנהלת המוסד. **אין להעלות את הקבצים המלאים ל-Git בשום אופן.**

---

## English

This guide describes the instructions for completing the CSV data import templates for the first school pilot.

> [!WARNING]
> **Data Security and Leak Prevention**
> - **Do not commit filled CSV templates containing real data to the Git repository.**
> - **Do not paste real student or staff data into the AI chat window.**
> - Keep all populated spreadsheets in a secure local directory **outside** of the repository tree.
> - Use institutional domain emails only for staff accounts.

### Recommended File Filling Order
1. **Import Manifest**: Set the school year and operator contacts.
2. **Staff Access Grants**: Define the whitelist of emails authorized to log in.
3. **Staff Roles**: Map users to their respective workspace roles.
4. **Student Groups**: Create the student groups/classes.
5. **Students**: Roster the students along with parent/guardian contact info.
6. **Group Mentors**: Assign staff mentors to the student groups.
7. **Projects**: Set current project titles and initial project health status.
8. **Student Masters**: Map projects to their supervising project master.
9. **Student Goals**: Populate initial primary goals.
10. **Emotional Status Baseline**: *Highly Sensitive* - Leave empty unless explicitly approved by the pilot director.

---

### Allowed Enums & Formats

- **Staff Roles**: 
  `staff`, `mentor`, `master`, `counselor`, `leadership`, `manager`, `super_admin`
- **Project/Emotional Statuses**: 
  `green`, `yellow`, `red`
- **Goal Status**: 
  `active`, `completed`, `paused`, `archived`
- **Booleans**: 
  `true`, `false` (lowercase only)
- **Date Format**: 
  `YYYY-MM-DD` (e.g. `2025-09-01`)
- **External Student ID (external_student_id)**: 
  A temporary unique key (e.g. local school database registration code) used solely to link relational tables during parsing. The script generates random UUIDs for database storage, and external IDs are discarded.

---

### Verification Checklist before Delivery
- [ ] Headers match the templates exactly (case-sensitive, English).
- [ ] No blank rows or missing required columns.
- [ ] All staff emails are lowercase.
- [ ] The `external_student_id` is identical across student, project, goal, and master files for each record.
- [ ] Dates match the `YYYY-MM-DD` format.
- [ ] Files are saved with `UTF-8` encoding.

### Delivery Protocol
Completed data files must be sent via a secure, school-approved channel to the technical operator. **Under no circumstances should these files be added to version control.**

---

### Operational Status
This task is for template structure and instructions only. **Database import execution and validator script implementation are currently blocked** pending approval of this design.
