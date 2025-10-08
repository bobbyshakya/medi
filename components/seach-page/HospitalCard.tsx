"use client"

import useSWR from "swr"
import { useMemo, useState } from "react"

type City = {
  _id: string
  name: string
  state?: { _id: string; name: string } | null
  country?: { _id: string; name: string } | null
}

type Branch = {
  _id: string
  branchName: string
  address?: string
  primaryLocation?: City | 'jdjdh'
}

type Hospital = {
  _id: string
  name: string
  slug?: string
  logo?: string
  description?: string
  branches: Branch[]
  branchCount: number
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function HospitalSearch() {
  const [search, setSearch] = useState("")
  const [cityId, setCityId] = useState("")

  const { data: citiesRes } = useSWR<{ data: City[] }>("/api/cities?limit=1000", fetcher)
  const cities = citiesRes?.data ?? []

  const qs = useMemo(() => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (cityId) params.set("cityId", cityId)
    params.set("limit", "50")
    return params.toString()
  }, [search, cityId])

  const { data: hospitalsRes, isLoading } = useSWR<{ data: Hospital[] }>(`/api/hospitals?${qs}`, fetcher)

  const hospitals = hospitalsRes?.data ?? []

  return (
    <section className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm">Search by hospital name</label>
          <input
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            placeholder="e.g., City Care Hospital"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Hospital name search"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm">City</label>
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
            aria-label="City filter"
          >
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
                {c.state?.name ? `, ${c.state.name}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => {
              setSearch("")
              setCityId("")
            }}
            className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm"
            aria-label="Reset filters"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading hospitals…</div>
        ) : hospitals.length === 0 ? (
          <div className="text-sm text-muted-foreground">No hospitals found.</div>
        ) : (
          <ul className="grid grid-cols-1 gap-4">
            {hospitals.map((h) => (
              <li key={h._id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-medium">{h.name}</h3>
                    {h.description ? (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{h.description}</p>
                    ) : null}
                  </div>
                  {typeof h.branchCount === "number" ? (
                    <span className="text-xs rounded bg-secondary px-2 py-1">
                      {h.branchCount} branch{h.branchCount === 1 ? "" : "es"}
                    </span>
                  ) : null}
                </div>

                {h.branches?.length ? (
                  <div className="mt-3">
                    <h4 className="text-sm font-semibold">Branches</h4>
                    <div className="mt-2 grid grid-cols-1 gap-2">
                      {h.branches.map((b) => (
                        <div key={b._id} className="rounded border p-2">
                          <div className="text-sm font-medium">{b.branchName}</div>
                          <div className="text-xs text-muted-foreground">
                            {typeof b.primaryLocation === 'object' && b.primaryLocation?.name ? b.primaryLocation?.name : "Unknown City"}
                          </div>
                          {b.address ? <div className="text-xs text-muted-foreground">{b.address}</div> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
