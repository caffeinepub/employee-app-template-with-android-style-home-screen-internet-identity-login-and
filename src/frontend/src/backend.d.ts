import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addContent(id: string, content: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getCallerUserProfile(): Promise<{
        name: string;
    } | null>;
    getCallerUserRole(): Promise<UserRole>;
    getContent(id: string): Promise<string>;
    getUserProfile(user: Principal): Promise<{
        name: string;
    } | null>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    requestApproval(): Promise<void>;
    requestApprovalWithName(name: string): Promise<{
        name: string;
        fourCharId: string;
    }>;
    saveCallerUserProfile(profile: {
        name: string;
    }): Promise<void>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
}
