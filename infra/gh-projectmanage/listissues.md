 gh project item-list 1 --owner ASKIEP --format json --limit 2000 \
| jq '
  .items
  | map(select(.content.type == "Issue"))
  | map({
      number: .content.number,
      title: .content.title,
      status: (.status // ""),
      repo: (.content.repository // ""),
      url: .content.url,
      body: (.content.body // "")
    })
' > askiep_project_issues.json