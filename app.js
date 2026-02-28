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

    // Apply filters
    var searchTerm = $("#search-input").val().toLowerCase();
    var statusFilter = $("#status-filter").val();
    var priorityFilter = $("#priority-filter").val();
    var sortBy = $("#sort-by").val();

    // Filter tasks
    var filteredTasks = tasks.filter(function (task) {
      var matchesSearch =
        !searchTerm ||
        task.name.toLowerCase().includes(searchTerm) ||
        task.desc.toLowerCase().includes(searchTerm);
      var matchesStatus = !statusFilter || task.status === statusFilter;
      var matchesPriority = !priorityFilter || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });

    // Sort tasks
    filteredTasks.sort(function (a, b) {
      switch (sortBy) {
        case "oldest":
          return a.id.localeCompare(b.id);
        case "name":
          return a.name.localeCompare(b.name);
        case "priority":
          var priorityOrder = { High: 3, Medium: 2, Low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case "newest":
        default:
          return b.id.localeCompare(a.id);
      }
    });

    if (filteredTasks.length === 0) {
      var message =
        searchTerm || statusFilter || priorityFilter
          ? '<p class="empty-msg">No tasks match your filters.</p>'
          : '<p class="empty-msg">No tasks yet. Add one above!</p>';
      $list.html(message);
      return;
    }

    $.each(filteredTasks, function (_i, t) {
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
        '<button class="btn btn-toggle-status" data-id="' +
        t.id +
        '" title="Toggle Status">' +
        getNextStatus(t.status) +
        "</button>" +
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

    updateStats(filteredTasks);
  }

  // ── Helper function to get next status ──
  function getNextStatus(currentStatus) {
    switch (currentStatus) {
      case "Pending":
        return "▶️";
      case "In Progress":
        return "✅";
      case "Completed":
        return "🔄";
      default:
        return "▶️";
    }
  }

  // ── Update stats dashboard ──
  function updateStats(tasks) {
    var allTasks = getTasks();
    var total = allTasks.length;
    var pending = allTasks.filter((t) => t.status === "Pending").length;
    var inProgress = allTasks.filter((t) => t.status === "In Progress").length;
    var completed = allTasks.filter((t) => t.status === "Completed").length;

    $("#total-tasks").text(total);
    $("#pending-tasks").text(pending);
    $("#inprogress-tasks").text(inProgress);
    $("#completed-tasks").text(completed);
  }
  // ── Show notification ──
  function showNotification(message, type = "info") {
    var $notification = $("#notification");
    $notification
      .removeClass("hidden success error info")
      .addClass(type)
      .text(message)
      .fadeIn(300);

    setTimeout(function () {
      $notification.fadeOut(300, function () {
        $notification.addClass("hidden");
      });
    }, 3000);
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

    // Show notification
    if (taskId) {
      showNotification("Task updated successfully! ✅", "success");
    } else {
      showNotification("New task added! 🎉", "success");
    }
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
      showNotification("Task deleted successfully! 🗑️", "success");
    }
  });

  // ── Quick Status Toggle functionality ──
  $(document).on("click", ".btn-toggle-status", function () {
    var taskId = $(this).data("id");
    var tasks = getTasks();
    var taskIndex = tasks.findIndex(function (t) {
      return t.id === taskId;
    });

    if (taskIndex !== -1) {
      var currentStatus = tasks[taskIndex].status;
      var nextStatus;

      switch (currentStatus) {
        case "Pending":
          nextStatus = "In Progress";
          break;
        case "In Progress":
          nextStatus = "Completed";
          break;
        case "Completed":
          nextStatus = "Pending";
          break;
        default:
          nextStatus = "Pending";
      }

      tasks[taskIndex].status = nextStatus;
      saveTasks(tasks);
      renderTasks();
      showNotification("Status changed to " + nextStatus + "! 🔄", "success");
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

  // ── Search and Filter Event Listeners ──
  $("#search-input").on("input", function () {
    renderTasks();
  });

  $("#status-filter, #priority-filter, #sort-by").on("change", function () {
    renderTasks();
  });

  // ── Initial render ──
  renderTasks();
});
