import { useRef, useState } from "react";
import {
  Camera,
  Edit3,
  Mail,
  Phone,
  Globe,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useTheme } from "../../context/ThemeContext";
import defaultAvatar from "../../assets/default-avatar.png";
import "../../styles/advisorProfile.css";

const ADVISOR_PROFILE_STORAGE_KEY = "gradglow_advisor_profile";
const ADVISOR_PROFILE_IMAGE_STORAGE_KEY = "advisorProfilePhoto";

const INITIAL_PROFILE = {
  name: "Dr. Sarah Johnson",
  title: "Senior Academic Advisor",
  email: "sarah.johnson@northbridgeuniversity.edu",
  phone: "5551234567",
  website: "www.northbridgeuniversity.edu/advising",
  contactSummary:
    "Students can reach you through your university email, advising office phone, and official advising link.",
  bio: "Dedicated academic advisor with over 8 years of experience helping students navigate academic planning, career pathways, and personal growth.",
  links: [
    { title: "LinkedIn", url: "https://linkedin.com" },
    { title: "University Profile", url: "https://university.edu" },
  ],
};

function loadStoredProfile() {
  try {
    const stored = localStorage.getItem(ADVISOR_PROFILE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : INITIAL_PROFILE;
  } catch {
    return INITIAL_PROFILE;
  }
}

function loadStoredImage() {
  return localStorage.getItem(ADVISOR_PROFILE_IMAGE_STORAGE_KEY) || defaultAvatar;
}

function formatPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length !== 10) return digits;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function AdvisorProfile() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [draft, setDraft] = useState(INITIAL_PROFILE);
  const [isEditing, setIsEditing] = useState(false);

  const [profileImage, setProfileImage] = useState(loadStoredImage);
  const [photoPreview, setPhotoPreview] = useState(loadStoredImage);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);

  const [photoError, setPhotoError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const current = isEditing ? draft : profile;

  function persistProfile(nextProfile) {
    localStorage.setItem(ADVISOR_PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
  }

  function persistImage(nextImage) {
    localStorage.setItem(ADVISOR_PROFILE_IMAGE_STORAGE_KEY, nextImage);
    window.dispatchEvent(new Event("storage"));
  }

  function startEditing() {
    setDraft(profile);
    setPhoneError("");
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraft(profile);
    setPhoneError("");
    setIsEditing(false);
  }

  function saveEditing() {
    const cleanPhone = String(draft.phone || "").replace(/\D/g, "");

    if (cleanPhone.length !== 10) {
      setPhoneError("Phone number must be exactly 10 digits.");
      return;
    }

    const nextProfile = {
      ...draft,
      phone: cleanPhone,
    };

    setProfile(nextProfile);
    setDraft(nextProfile);
    setPhoneError("");
    setIsEditing(false);
    persistProfile(nextProfile);
  }

  function updateField(field, value) {
    setDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function updateLinkField(index, field, value) {
    setDraft((prev) => ({
      ...prev,
      links: prev.links.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      ),
    }));
  }

  function addLink() {
    setDraft((prev) => ({
      ...prev,
      links: [...prev.links, { title: "", url: "" }],
    }));
  }

  function removeLink(index) {
    setDraft((prev) => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index),
    }));
  }

  function openPhotoModal() {
    setPhotoPreview(profileImage);
    setPhotoError("");
    setPhotoModalOpen(true);
  }

  function closePhotoModal() {
    setPhotoModalOpen(false);
    setPhotoError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      setPhotoError("Please upload PNG, JPG, JPEG, or WEBP image only.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(String(reader.result));
      setPhotoError("");
    };
    reader.readAsDataURL(file);
  }

  function savePhoto() {
    setProfileImage(photoPreview);
    persistImage(photoPreview);
    closePhotoModal();
  }

  return (
    <div className={`advisorProfilePage ${darkMode ? "advisorProfilePage--dark" : ""}`}>
      <div className="advisorProfileShell advisorPageContainer">
        <header className="advisorProfileHeader">
          <div>
            <div className="advisorProfileEyebrow">Advisor Workspace</div>
            <h1>Advisor Profile</h1>
            <p>Manage your professional details, contact information, and public profile links.</p>
          </div>

          <div className="advisorProfileActionGroup">
            <button
              type="button"
              className="advisorProfileBackBtn"
              onClick={() => navigate("/advisor/dashboard")}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            {!isEditing ? (
              <button
                type="button"
                className="advisorProfileEditBtn"
                onClick={startEditing}
              >
                <Edit3 size={16} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="advisorProfileGhostBtn"
                  onClick={cancelEditing}
                >
                  <X size={16} />
                  <span>Cancel</span>
                </button>

                <button
                  type="button"
                  className="advisorProfileSaveBtn"
                  onClick={saveEditing}
                >
                  <Save size={16} />
                  <span>Save Profile</span>
                </button>
              </>
            )}
          </div>
        </header>

        <section className="advisorProfileCard">
          <div className="advisorProfileTop">
            <div className="advisorProfileLeft">
              <div className="advisorProfileImageWrap">
                <img
                  src={profileImage || defaultAvatar}
                  alt="Advisor profile"
                  className="advisorProfileImage"
                />
              </div>

              <button
                type="button"
                className="advisorProfilePhotoBtn"
                onClick={openPhotoModal}
              >
                <Camera size={16} />
                <span>Change Photo</span>
              </button>
            </div>

            <div className="advisorProfileRight">
              <div className="advisorProfileTitleRow">
                <div className="advisorProfileMainInfo">
                  {isEditing ? (
                    <div className="advisorProfileEditGrid">
                      <label className="advisorProfileField advisorProfileField--full">
                        <span>Name</span>
                        <input
                          type="text"
                          value={current.name}
                          onChange={(e) => updateField("name", e.target.value)}
                        />
                      </label>

                      <label className="advisorProfileField advisorProfileField--full">
                        <span>Title</span>
                        <input
                          type="text"
                          value={current.title}
                          onChange={(e) => updateField("title", e.target.value)}
                        />
                      </label>
                    </div>
                  ) : (
                    <>
                      <h2>{current.name}</h2>
                      <div className="advisorProfileRole">{current.title}</div>
                    </>
                  )}
                </div>
              </div>

              <div className="advisorProfileInfoGrid">
                <div className="advisorProfileInfoItem">
                  <div className="advisorProfileInfoIcon">
                    <Mail size={16} />
                  </div>
                  <div className="advisorProfileInfoContent">
                    <div className="advisorProfileInfoLabel">Email</div>
                    {isEditing ? (
                      <input
                        type="email"
                        value={current.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        className="advisorProfileInlineInput"
                      />
                    ) : (
                      <div className="advisorProfileInfoValue">{current.email}</div>
                    )}
                  </div>
                </div>

                <div className="advisorProfileInfoItem">
                  <div className="advisorProfileInfoIcon">
                    <Phone size={16} />
                  </div>
                  <div className="advisorProfileInfoContent">
                    <div className="advisorProfileInfoLabel">Phone</div>
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={current.phone}
                          onChange={(e) => {
                            const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
                            setPhoneError("");
                            updateField("phone", digitsOnly);
                          }}
                          className="advisorProfileInlineInput"
                          maxLength={10}
                          placeholder="Enter 10-digit phone number"
                        />
                        {phoneError ? <div className="advisorProfileError">{phoneError}</div> : null}
                      </>
                    ) : (
                      <div className="advisorProfileInfoValue">
                        {formatPhone(current.phone)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="advisorProfileInfoItem advisorProfileInfoItem--wide">
                  <div className="advisorProfileInfoIcon">
                    <Globe size={16} />
                  </div>
                  <div className="advisorProfileInfoContent">
                    <div className="advisorProfileInfoLabel">Website</div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={current.website}
                        onChange={(e) => updateField("website", e.target.value)}
                        className="advisorProfileInlineInput"
                      />
                    ) : (
                      <div className="advisorProfileInfoValue">{current.website}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="advisorProfileSections">
            <section className="advisorProfileSection">
              <div className="advisorProfileSectionHeader">
                <h3>Contact</h3>
              </div>

              {isEditing ? (
                <label className="advisorProfileField advisorProfileField--full">
                  <span>Contact Summary</span>
                  <textarea
                    rows={4}
                    value={current.contactSummary}
                    onChange={(e) => updateField("contactSummary", e.target.value)}
                  />
                </label>
              ) : (
                <p>{current.contactSummary}</p>
              )}
            </section>

            <section className="advisorProfileSection">
              <div className="advisorProfileSectionHeader">
                <h3>Biography</h3>
              </div>

              {isEditing ? (
                <label className="advisorProfileField advisorProfileField--full">
                  <span>Biography</span>
                  <textarea
                    rows={7}
                    value={current.bio}
                    onChange={(e) => updateField("bio", e.target.value)}
                  />
                </label>
              ) : (
                <p>{current.bio}</p>
              )}
            </section>

            <section className="advisorProfileSection">
              <div className="advisorProfileSectionHeader">
                <h3>Links</h3>
              </div>

              {isEditing ? (
                <div className="advisorProfileLinksEditor">
                  {current.links.map((link, index) => (
                    <div key={index} className="advisorProfileLinkEditRow">
                      <input
                        type="text"
                        placeholder="Title"
                        value={link.title}
                        onChange={(e) => updateLinkField(index, "title", e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="URL"
                        value={link.url}
                        onChange={(e) => updateLinkField(index, "url", e.target.value)}
                      />
                      <button
                        type="button"
                        className="advisorProfileDeleteBtn"
                        onClick={() => removeLink(index)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="advisorProfileAddBtn"
                    onClick={addLink}
                  >
                    <Plus size={14} />
                    <span>Add another link</span>
                  </button>
                </div>
              ) : (
                <div className="advisorProfileLinks">
                  {current.links.map((link, index) => (
                    <a
                      key={index}
                      href={link.url || "#"}
                      className="advisorProfileLinkPill"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {link.title || "Untitled Link"}
                    </a>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>

        {photoModalOpen ? (
          <div className="advisorProfilePhotoOverlay" onMouseDown={closePhotoModal}>
            <div
              className="advisorProfilePhotoModal"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="advisorProfilePhotoModalHeader">
                <h3>Edit Profile Picture</h3>
                <button
                  type="button"
                  className="advisorProfilePhotoModalClose"
                  onClick={closePhotoModal}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="advisorProfilePhotoModalBody">
                <div className="advisorProfilePhotoPreviewFrame">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Profile preview"
                      className="advisorProfilePhotoPreview"
                    />
                  ) : (
                    <div className="advisorProfilePhotoPlaceholder">
                      <ImageIcon size={54} />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="advisorProfilePhotoSelectBtn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload Photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handlePhotoChange}
                  hidden
                />

                <div className="advisorProfilePhotoHelp">
                  Accepted formats: PNG, JPG, JPEG, WEBP
                </div>

                {photoError ? (
                  <p className="advisorProfilePhotoError">{photoError}</p>
                ) : null}
              </div>

              <div className="advisorProfilePhotoModalFooter">
                <button
                  type="button"
                  className="advisorProfileGhostBtn"
                  onClick={closePhotoModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="advisorProfileSaveBtn"
                  onClick={savePhoto}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}