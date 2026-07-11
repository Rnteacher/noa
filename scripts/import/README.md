# Real-Data CSV Ingestion Validator CLI

This script validates populated CSV datasets to ensure they comply with the application's database constraints, allowed enums, unique indices, and foreign key relations prior to dry-run or ingestion execution.

## Usage

Specify the target directory containing your completed CSV spreadsheets as the argument:

```bash
npm run validate:import -- <directory-path>
```

### Example (Mock Data Test)

Verify the validator script works by running it against the example directory:

```bash
npm run validate:import -- docs/import/examples
```

## Validation Checks Performed

1. **Mandatory Files Presence**: Verifies all required CSV files are present in the directory.
2. **CSV Syntax and Headers**: Ensures standard UTF-8 parsing and exact case-sensitive matches for required headers.
3. **Enum Values**: Validates role types (`staff`, `mentor`, `master`, etc.), statuses (`green`, `yellow`, `red`), and goal configurations.
4. **Data Formats**: Validates emails, ISO phone numbers, and `YYYY-MM-DD` date ranges.
5. **Relational Integrity**:
   - Ensures all assigned students exist in the main roster.
   - Ensures all group mentors and project masters match pre-authorized staff emails.
   - Restricts current projects to a maximum of one per student.
   - Restricts primary goals to a maximum of one per student.
