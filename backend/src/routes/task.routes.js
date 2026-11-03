import { Router } from "express";
import {
  createSubTask,
  createTask,
  deleteSubTask,
  deleteTask,
  getTaskById,
  getTasks,
  updateSubTask,
  updateTask,
} from "../controllers/task.controllers.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
  createSubTaskValidator,
  createTaskValidator,
  updateSubTaskValidator,
  updateTaskValidator,
} from "../validators/index.js";
import {
  validateProjectPermission,
  verifyJWT,
} from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";

const router = Router();
router.use(verifyJWT);

// roles that may create, edit and delete tasks and subtasks (see the PRD permission matrix)
const canManage = [UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN];

router
  .route("/:projectId")
  .get(validateProjectPermission(AvailableUserRole), getTasks)
  .post(
    validateProjectPermission(canManage),
    upload.array("attachments"),
    createTaskValidator(),
    validate,
    createTask,
  );

router
  .route("/:projectId/t/:taskId")
  .get(validateProjectPermission(AvailableUserRole), getTaskById)
  .put(
    validateProjectPermission(canManage),
    upload.array("attachments"),
    updateTaskValidator(),
    validate,
    updateTask,
  )
  .delete(validateProjectPermission(canManage), deleteTask);

router
  .route("/:projectId/t/:taskId/subtasks")
  .post(
    validateProjectPermission(canManage),
    createSubTaskValidator(),
    validate,
    createSubTask,
  );

// every member may tick a subtask complete; the controller blocks members from renaming
router
  .route("/:projectId/st/:subTaskId")
  .put(
    validateProjectPermission(AvailableUserRole),
    updateSubTaskValidator(),
    validate,
    updateSubTask,
  )
  .delete(validateProjectPermission(canManage), deleteSubTask);

export default router;
