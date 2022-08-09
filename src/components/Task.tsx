import { CheckIcon, PencilAltIcon, TrashIcon } from "@heroicons/react/solid";
import { RefObject, useEffect, useRef, useState } from "react";
import { trpc } from "../utils/trpc";

function useClickOutside({
  ref,
  callback,
  enabled,
}: {
  ref: RefObject<any>;
  callback: () => void;
  enabled: boolean;
}) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target)) {
        callbackRef.current();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, enabled]);
}

const Task = ({ task }: Todo) => {
  const [editing, setEditing] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useContext();
  const [content, setContent] = useState(task.content);
  const [done, setDone] = useState(task.isDone);

  useEffect(() => {
    setContent(task.content);
  }, [task.content]);
  useEffect(() => {
    setDone(task.isDone);
  }, [task.isDone]);

  const deleteTask = trpc.useMutation("todo.delete", {
    async onMutate() {
      await utils.cancelQuery(["todo.all"]);
      const allTasks = utils.getQueryData(["todo.all"]);
      if (!allTasks) return;

      utils.setQueryData(
        ["todo.all"],
        allTasks.filter((t) => t.id != task.id)
      );
    },
  });
  const editTask = trpc.useMutation("todo.edit", {
    async onMutate({ id, data }) {
      await utils.cancelQuery(["todo.all"]);
      const allTasks = utils.getQueryData(["todo.all"]);
      if (!allTasks) return;

      utils.setQueryData(
        ["todo.all"],
        allTasks.map((t) => (t.id === id ? { ...t, ...data } : t))
      );
    },
  });

  useClickOutside({
    ref: wrapperRef,
    enabled: editing,
    callback() {
      editTask.mutate({
        id: task.id,
        data: { content },
      });
      setEditing(false);
    },
  });

  return (
    <div
      className="my-4 flex items-center justify-between gap-4 p-4 duration-500 border-2 border-gray-500 rounded shadow-xl motion-safe:hover:scale-105"
      ref={wrapperRef}
    >
      <button className="p-1 m-0" onClick={() => setEditing(!editing)}>
        {editing ? (
          <CheckIcon width={24} height={24} />
        ) : (
          <PencilAltIcon width={24} height={24} />
        )}
      </button>
      <input
        className={`w-[80%] text-center bg-transparent rounded-xl text-lg text-gray-700 dark:text-gray-200`}
        disabled={!editing}
        type="text"
        value={content}
        ref={inputRef}
        onChange={(e) => setContent(e.currentTarget.value)}
        onKeyPress={(e) => {
          if (e.key === "Enter") {
            editTask.mutate({
              id: task.id,
              data: { content },
            });
            setEditing(false);
          }
        }}
      />
      <button
        className="bg-red-500 p-1 m-0"
        onClick={() => {
          deleteTask.mutate(task.id);
        }}
      >
        <TrashIcon width={24} height={24} />
      </button>
    </div>
  );
};

export default Task;
