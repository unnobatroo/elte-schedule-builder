# User guide 🧭

ELTE Schedule Builder helps compare class groups before registration and keep a
personal schedule in one browser. It does not register classes and is not an
official ELTE service.

[Try DEMO data](#try-it-with-demo-data) · [Build a schedule](#build-a-schedule-from-subject-codes) · [Share](#share-a-schedule) · [Export](#export-to-google-calendar) · [Troubleshoot](#storage-and-troubleshooting)

> [!IMPORTANT]
> Always verify your final timetable in Neptun or another official ELTE system.

## Try it with DEMO data

Use `DEMO-1` through `DEMO-6` when you want to explore the application without
depending on live Tanrend data. DEMO subjects follow the same application flow
as real subject codes but are served locally by the backend.

## Build a schedule from subject codes

1. Open **Schedule Builder**.
2. Paste one or more subject codes from Neptun. Whitespace and commas are
   accepted as separators.
3. Select **Generate schedule**.
4. Review any subjects for which Tanrend returned no usable classes.
5. Use the subject and event checkboxes to keep only the classes you want.

Only enabled events appear in the calendar and in sharing or export actions.

## Search and select a class

1. Open **Search**.
2. Enter a subject code such as `DEMO-1` and select **Search**.
3. Review the available time, group, instructor, and location.
4. Select **Add to schedule** for the class you want.

Selecting a different group of the same type replaces the enabled group while
preserving the rest of that subject.

## Conflicts and lecture exemption

Enabled events that overlap are marked as conflicts. The lecture-exemption
setting lets the planner ignore lectures when computing conflicts. Use this ONLY IF you have Lecture Exemption.

## Multiple schedules

Use **My schedules** to create, switch, rename, or delete local schedules. Each
schedule keeps its own subjects and lecture-exemption setting. The last
remaining schedule cannot be deleted.

## Share a schedule

**Share Schedule** copies a URL containing the enabled class codes and
lecture-exemption setting. Opening it creates a new local schedule instead of
overwriting schedules already saved in that browser.

Treat share links as readable information: anyone with the URL can recover the
class codes it contains.

## Export to Google Calendar

**Export to Google Calendar** lists the currently visible events. Each **Add to
Calendar** button opens a Google Calendar template for one weekly event. Review
the date, time, recurrence, and semester end before saving it in Google.
If the browser blocks the new window, the export dialog explains that pop-ups
must be allowed before trying again.

## Storage and troubleshooting

Schedules are stored only in the current browser's `localStorage`. Clearing site
data, using private browsing, or changing browsers can remove or hide them.

If a subject is missing, Tanrend may not have published it yet, the code may be
incorrect, or the upstream service may be unavailable. Try a `DEMO-*` code to
distinguish an application problem from unavailable live data.
