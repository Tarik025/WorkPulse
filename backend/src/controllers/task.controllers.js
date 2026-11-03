import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { Task } from "../models/task.models.js";
import { Subtask } from "../models/subtask.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import mongoose from "mongoose";
import { UserRolesEnum } from "../utils/constants.js";

const toId = (id) => new mongoose.Types.ObjectId(id);

// url of an uploaded file. multer saves it as `${Date.now()}-${originalname}` (file.filename),
// so the link must use file.filename, not file.originalname.
const buildAttachments = (files = []) =>
  files.map((file) => ({
    url: `${process.env.SERVER_URL || ""}/images/${file.filename}`,
    mimetype: file.mimetype,
    size: file.size,
  }));

// a task can only be assigned to someone who is a member of that project
const assertAssigneeIsMember = async (projectId, userId) => {
  const member = await ProjectMember.findOne({
    project: toId(projectId),
    user: toId(userId),
  });
  if (!member) {
    throw new ApiError(400, "Assigned user is not a member of this project");
  }
};

// find a task, but only if it belongs to the project in the URL
const findTaskInProject = async (projectId, taskId) => {
  const task = await Task.findOne({ _id: toId(taskId), project: toId(projectId) });
  if (!task) {
    throw new ApiError(404, "Task not found");
  }
  return task;
};

// find a subtask, but only if its task belongs to the project in the URL
const findSubtaskInProject = async (projectId, subTaskId) => {
  const subtask = await Subtask.findById(subTaskId);
  if (!subtask) {
    throw new ApiError(404, "Subtask not found");
  }
  const task = await Task.findOne({
    _id: subtask.task,
    project: toId(projectId),
  });
  if (!task) {
    throw new ApiError(404, "Subtask not found");
  }
  return subtask;
};

const getTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }
  const tasks = await Task.find({
    project: toId(projectId),
  })
    .populate("assignedTo", "avatar username fullName")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, tasks, "Tasks fetched successfully"));
});

const createTask = asyncHandler(async (req, res) => {
  const { title, description, assignedTo, status } = req.body ?? {};
  const { projectId } = req.params;
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  if (assignedTo) {
    await assertAssigneeIsMember(projectId, assignedTo);
  }

  const task = await Task.create({
    title,
    description,
    project: toId(projectId),
    assignedTo: assignedTo ? toId(assignedTo) : undefined,
    status: status || undefined,
    assignedBy: toId(req.user._id),
    attachments: buildAttachments(req.files),
  });

  return res
    .status(201)
    .json(new ApiResponse(201, task, "Task created successfully"));
});

const getTaskById = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;

  const task = await Task.aggregate([
    {
      $match: {
        _id: toId(taskId),
        project: toId(projectId), // the task must belong to the project in the URL
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "assignedTo",
        foreignField: "_id",
        as: "assignedTo",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "subtasks",
        localField: "_id",
        foreignField: "task",
        as: "subtasks",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "createdBy",
              foreignField: "_id",
              as: "createdBy",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              createdBy: {
                $arrayElemAt: ["$createdBy", 0],
              },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        assignedTo: {
          $arrayElemAt: ["$assignedTo", 0],
        },
      },
    },
  ]);

  if (!task || task.length === 0) {
    throw new ApiError(404, "Task not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, task[0], "Task fetched successfully"));
});

const updateTask = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;
  const { title, description, assignedTo, status } = req.body ?? {};

  const task = await findTaskInProject(projectId, taskId);

  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (status !== undefined && status !== "") task.status = status;

  if (assignedTo !== undefined) {
    if (assignedTo) {
      await assertAssigneeIsMember(projectId, assignedTo);
      task.assignedTo = toId(assignedTo);
    } else {
      task.assignedTo = undefined; // empty value means "unassign"
    }
  }

  if (req.files?.length) {
    task.attachments.push(...buildAttachments(req.files));
  }

  await task.save();

  return res
    .status(200)
    .json(new ApiResponse(200, task, "Task updated successfully"));
});

const deleteTask = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;

  const task = await findTaskInProject(projectId, taskId);
  await Subtask.deleteMany({ task: task._id });
  await task.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, task, "Task deleted successfully"));
});

const createSubTask = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;
  const { title } = req.body ?? {};

  const task = await findTaskInProject(projectId, taskId);

  const subtask = await Subtask.create({
    title,
    task: task._id,
    createdBy: toId(req.user._id),
  });

  return res
    .status(201)
    .json(new ApiResponse(201, subtask, "Subtask created successfully"));
});

const updateSubTask = asyncHandler(async (req, res) => {
  const { projectId, subTaskId } = req.params;
  const { title, isCompleted } = req.body ?? {};

  const subtask = await findSubtaskInProject(projectId, subTaskId);

  // members may only tick a subtask on or off; admins and project admins may also rename it
  if (title !== undefined) {
    if (req.user.role === UserRolesEnum.MEMBER) {
      throw new ApiError(403, "Members can only mark a subtask as complete");
    }
    subtask.title = title;
  }
  if (isCompleted !== undefined) {
    subtask.isCompleted = isCompleted;
  }

  await subtask.save();

  return res
    .status(200)
    .json(new ApiResponse(200, subtask, "Subtask updated successfully"));
});

const deleteSubTask = asyncHandler(async (req, res) => {
  const { projectId, subTaskId } = req.params;

  const subtask = await findSubtaskInProject(projectId, subTaskId);
  await subtask.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, subtask, "Subtask deleted successfully"));
});

export {
  createSubTask,
  createTask,
  deleteTask,
  deleteSubTask,
  getTaskById,
  getTasks,
  updateSubTask,
  updateTask,
};
