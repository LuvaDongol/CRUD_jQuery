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
        '<div class="task-card" data-id="' +
        t.id +
        '">' +
        '<div class="task-info">' +
        "<h3>" +
        escapeHtml(t.name) +
        "</h3>" +
        (t.desc ? "<p>" + escapeHtml(t.desc) + "</p>" : "") +
        '<div class="task-meta">' +
        priorityBadge(t.priority) +
        statusBadge(t.status) +
        "</div>" +
        "</div>" +
        '<div class="task-actions">' +
        '<button class="btn btn-edit" data-id="' +
        t.id +
        '">Edit</button>' +
        '<button class="btn btn-delete" data-id="' +
        t.id +
        '">Delete</button>' +
        "</div>" +
        "</div>";
      $list.append(card);
    });
  }

  // ── CREATE/UPDATE – Add or update task ──
  $("#task-form").on("submit", function (e) {
    e.preventDefault();

    var name = $.trim($("#task-name").val());
    var desc = $.trim($("#task-desc").val());
    var priority = $("#task-priority").val();
    var status = $("#task-status").val();
    var taskId = $("#task-id").val();

    if (!name) return;

    var tasks = getTasks();

    if (taskId) {
      // UPDATE existing task
      var taskIndex = tasks.findIndex(function (t) {
        return t.id === taskId;
      });
      if (taskIndex !== -1) {
        tasks[taskIndex] = {
          id: taskId,
          name: name,
          desc: desc,
          priority: priority,
          status: status,
        };
      }
    } else {
      // CREATE new task
      tasks.unshift({
        id: generateId(),
        name: name,
        desc: desc,
        priority: priority,
        status: status,
      });
    }

    saveTasks(tasks);
    resetForm();
    renderTasks();
  });

  // ── EDIT functionality ──
  $(document).on("click", ".btn-edit", function () {
    var taskId = $(this).data("id");
    var tasks = getTasks();
    var task = tasks.find(function (t) {
      return t.id === taskId;
    });

    if (task) {
      $("#task-id").val(task.id);
      $("#task-name").val(task.name);
      $("#task-desc").val(task.desc);
      $("#task-priority").val(task.priority);
      $("#task-status").val(task.status);

      $("#form-title").text("Edit Task");
      $("#btn-submit").text("Update Task");
      $("#btn-cancel").show();

      // Scroll to form
      $("html, body").animate(
        {
          scrollTop: $(".form-card").offset().top - 20,
        },
        300
      );
    }
  });

  // ── Cancel edit functionality ──
  $("#btn-cancel").on("click", function () {
    resetForm();
  });

  // ── DELETE functionality ──
  $(document).on("click", ".btn-delete", function () {
    var taskId = $(this).data("id");
    var tasks = getTasks();
    var task = tasks.find(function (t) {
      return t.id === taskId;
    });

    if (
      task &&
      confirm('Are you sure you want to delete "' + task.name + '"?')
    ) {
      var updatedTasks = tasks.filter(function (t) {
        return t.id !== taskId;
      });
      saveTasks(updatedTasks);
      renderTasks();
    }
  });

  // ── Reset form helper ──
  function resetForm() {
    $("#task-form")[0].reset();
    $("#task-id").val("");
    $("#form-title").text("Add New Task");
    $("#btn-submit").text("Add Task");
    $("#btn-cancel").hide();
  }

  // ── Initial render ──
  renderTasks();
});
