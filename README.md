# n8n-nodes-trackingtime

This is an n8n community node that connects your workflows with [TrackingTime](https://trackingtime.co/), the cloud platform for tracking projects, tasks, and billable hours.

TrackingTime centralizes time tracking so teams can monitor productivity, collaborate on schedules, and export accurate timesheets for billing or payroll.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)
[Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

- Add Time Entry – create a new time entry for a TrackingTime account.
- Search Time Entry – query existing entries using flexible filters.
- Update Time Entry – modify the details of an existing time entry.

## Credentials

- Generate an **App Password** from your TrackingTime user profile (Settings → Integrations).
- In n8n, create a new **TrackingTime** credential and paste the password; the node authenticates via Basic auth with a fixed username of `API_TOKEN`.
- Ensure the TrackingTime user has access to the teams and projects whose time entries you plan to manage.

## Compatibility

- Requires n8n v1.0.0 or higher.
- Developed and tested against n8n 1.50+, which includes the resource mapper used by the search operation.

## Usage

- Drop the **TrackingTime** node into your workflow and choose the `Time Entry` resource.
- Select the operation (add, search, or update) and supply the required account, project, and time details.
- For searches, use the **Search Fields** mapper to set the same filters you would pass to the API (e.g. project ID, date range).
- Execute the node to sync your time data with TrackingTime without leaving n8n.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [TrackingTime API overview](https://support.trackingtime.co/en/articles/6329119-apps-integrations)
- [TrackingTime product site](https://trackingtime.co/)

## Version history

- 0.1.21 – Initial release with add, search, and update time entry operations.
