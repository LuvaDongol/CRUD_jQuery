$(function () {
  // ── Storage Helpers ──
  var STORAGE_KEY = "crud_tasks";

  function getTasks() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  }

  function saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // ── Escape HTML to prevent XSS ──
  function escapeHtml(str) {
    return $("<span>").text(str).html();
  }

  // ── Badge Helpers ──
  function priorityBadge(p) {
    var cls = { Low: "badge-low", Medium: "badge-medium", High: "badge-high" };
    return '<span class="badge ' + cls[p] + '">' + p + "</span>";
  }

  function statusBadge(s) {
    var cls = {
      Pending: "badge-pending",
      "In Progress": "badge-inprogress",
      Completed: "badge-completed",
    };
    return '<span class="badge ' + cls[s] + '">' + s + "</span>";
  }

  // ── READ – Render all tasks ──
  function renderTasks() {
    var tasks = getTasks();
    var $list = $("#task-list");
    $list.empty();

    if (tasks.length === 0) {
      $list.html('<p class="empty-msg">No tasks yet. Add one above!</p>');
      return;
    }

    $.each(tasks, function (_i, t) {
      var card =
        '<div class="task-card" data-id="' + t.id + '">' +
          '<div class="task-info">' +
            "<h3>" + escapeHtml(t.name) + "</h3>" +
            (t.desc ? "<p>" + escapeHtml(t.desc) + "</p>" : "") +
            '<div class="task-meta">' +
              priorityBadge(t.priority) +
              statusBadge(t.status) +
            "</div>" +
          "</div>" +
        "</div>";
      $list.append(card);
    });
  }

  // ── CREATE – Add new task ──
  $("#task-form").on("submit", function (e) {
    e.preventDefault();

    var name = $.trim($("#task-name").val());
    var desc = $.trim($("#task-desc").val());
    var priority = $("#task-priority").val();
    var status = $("#task-status").val();

    if (!name) return;

    var tasks = getTasks();

    tasks.unshift({
      id: generateId(),
      name: name,
      desc: desc,
      priority: priority,
      status: status,
    });

    saveTasks(tasks);
    $("#task-form")[0].reset();
    renderTasks();
  });

  // ── Initial render ──
  renderTasks();
});
