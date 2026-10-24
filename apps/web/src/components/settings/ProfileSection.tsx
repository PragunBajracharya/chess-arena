"use client";

import { useRef, useState, type FormEvent } from "react";
import { ImageUp, Trash2 } from "lucide-react";
import { usernameProblem } from "@chess/shared";
import { authClient, authErrorMessage, useSession } from "@/lib/auth-client";
import { removeAvatar, toAvatarBlob, uploadAvatar } from "@/lib/avatar-upload";
import { refreshSocket } from "@/lib/socket";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Field, FormNotice } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { Spinner } from "@/components/ui/Spinner";

export function ProfileSection() {
  const { data: session, refetch } = useSession();
  const user = session!.user;
  const current = user.displayUsername || user.username || user.name;

  const fileInput = useRef<HTMLInputElement>(null);
  const [pictureBusy, setPictureBusy] = useState<"upload" | "remove" | null>(null);
  const [pictureError, setPictureError] = useState<string | null>(null);

  const [username, setUsername] = useState(current);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  // Opponents see name and picture from the socket handshake, so reconnect to pass on the change.
  async function afterProfileChange() {
    await refetch();
    refreshSocket();
  }

  async function onPick(file: File | undefined) {
    if (!file) return;
    setPictureError(null);
    setPictureBusy("upload");
    try {
      await uploadAvatar(await toAvatarBlob(file));
      await afterProfileChange();
    } catch (e) {
      setPictureError((e as Error).message);
    } finally {
      setPictureBusy(null);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function onRemove() {
    setPictureError(null);
    setPictureBusy("remove");
    try {
      await removeAvatar();
      await afterProfileChange();
    } catch (e) {
      setPictureError((e as Error).message);
    } finally {
      setPictureBusy(null);
    }
  }

  async function onSaveName(e: FormEvent) {
    e.preventDefault();
    setNameSaved(false);
    const value = username.trim();
    const problem = usernameProblem(value);
    if (problem) return setNameError(problem);
    if (value === current) return;
    setNameSaving(true);
    setNameError(null);
    if (value.toLowerCase() !== user.username) {
      const { data } = await authClient.isUsernameAvailable({ username: value });
      if (data?.available === false) {
        setNameSaving(false);
        return setNameError("That username is taken.");
      }
    }
    const { error } = await authClient.updateUser({
      username: value,
      displayUsername: value,
      name: value,
    });
    setNameSaving(false);
    if (error) return setNameError(authErrorMessage(error, "The username couldn't be changed."));
    setNameSaved(true);
    await afterProfileChange();
  }

  return (
    <Panel title="Profile" description="What your opponents see next to the board.">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <Avatar name={current} image={user.image} size={88} />
        <div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
              className="sr-only"
              id="avatar-file"
              onChange={(e) => onPick(e.target.files?.[0])}
            />
            <Button
              variant="secondary"
              size="sm"
              disabled={pictureBusy !== null}
              onClick={() => fileInput.current?.click()}
            >
              {pictureBusy === "upload" ? (
                <Spinner size={14} />
              ) : (
                <ImageUp size={15} aria-hidden="true" />
              )}
              {user.image ? "Change picture" : "Upload picture"}
            </Button>
            {user.image && (
              <Button variant="ghost" size="sm" disabled={pictureBusy !== null} onClick={onRemove}>
                {pictureBusy === "remove" ? (
                  <Spinner size={14} />
                ) : (
                  <Trash2 size={15} aria-hidden="true" />
                )}
                Remove
              </Button>
            )}
          </div>
          <p className="mt-2 text-[13px] text-muted">
            Square pictures work best. Others are cropped to the centre.
          </p>
          {pictureError && (
            <p role="alert" className="mt-1 text-[13px] text-loss">
              {pictureError}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={onSaveName} className="mt-6 border-t border-line pt-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex-1">
            <Field
              label="Username"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={20}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.trim());
                setNameError(null);
                setNameSaved(false);
              }}
              error={nameError}
              hint="Unique. Letters, numbers and underscores, 3 to 20 characters."
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            className="sm:mt-[30px]"
            disabled={nameSaving || username === current}
          >
            {nameSaving ? "Saving" : "Save username"}
          </Button>
        </div>
        {nameSaved && (
          <div className="mt-3">
            <FormNotice>Username changed to {current}.</FormNotice>
          </div>
        )}
      </form>
    </Panel>
  );
}
