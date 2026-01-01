export namespace main {
	
	export class GitInfo {
	    remoteUrl: string;
	    currentBranch: string;
	    commitCount: number;
	    // Go type: time
	    lastCommitDate?: any;
	    hasUncommitted: boolean;
	    ahead: number;
	    behind: number;
	
	    static createFrom(source: any = {}) {
	        return new GitInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.remoteUrl = source["remoteUrl"];
	        this.currentBranch = source["currentBranch"];
	        this.commitCount = source["commitCount"];
	        this.lastCommitDate = this.convertValues(source["lastCommitDate"], null);
	        this.hasUncommitted = source["hasUncommitted"];
	        this.ahead = source["ahead"];
	        this.behind = source["behind"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ProjectMeta {
	    framework?: string;
	    packageManager?: string;
	    // Go type: time
	    lastOpened: any;
	    // Go type: time
	    createdAt: any;
	
	    static createFrom(source: any = {}) {
	        return new ProjectMeta(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.framework = source["framework"];
	        this.packageManager = source["packageManager"];
	        this.lastOpened = this.convertValues(source["lastOpened"], null);
	        this.createdAt = this.convertValues(source["createdAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Project {
	    id: string;
	    name: string;
	    path: string;
	    git?: GitInfo;
	    meta: ProjectMeta;
	    status: string;
	    category: string;
	    pinned: boolean;
	    notes?: string;
	
	    static createFrom(source: any = {}) {
	        return new Project(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.path = source["path"];
	        this.git = this.convertValues(source["git"], GitInfo);
	        this.meta = this.convertValues(source["meta"], ProjectMeta);
	        this.status = source["status"];
	        this.category = source["category"];
	        this.pinned = source["pinned"];
	        this.notes = source["notes"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class Settings {
	    theme: string;
	    defaultEditor: string;
	    scanPaths: string[];
	
	    static createFrom(source: any = {}) {
	        return new Settings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.theme = source["theme"];
	        this.defaultEditor = source["defaultEditor"];
	        this.scanPaths = source["scanPaths"];
	    }
	}

}

