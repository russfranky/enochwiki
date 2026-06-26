# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the
actual strings used in enochWIKI's issue tracker. Since the tracker is local markdown
(`.scratch/`), the "label" is the value written on the `Status:` line of each issue file.

| Canonical role    | Status string in our tracker | Meaning                                  |
| ----------------- | ---------------------------- | ---------------------------------------- |
| `needs-triage`    | `needs-triage`               | Maintainer needs to evaluate this issue  |
| `needs-info`      | `needs-info`                 | Waiting on reporter for more information |
| `ready-for-agent` | `ready-for-agent`            | Fully specified, ready for an AFK agent  |
| `ready-for-human` | `ready-for-human`            | Requires human implementation            |
| `wontfix`         | `wontfix`                    | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), write the corresponding
string on the issue file's `Status:` line.

Edit the right-hand column to match whatever vocabulary you actually use.
